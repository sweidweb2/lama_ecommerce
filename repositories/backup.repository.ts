import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ExtractFormat,
  ExtractProgressEvent,
} from "@/lib/validators/backup/extract";

export interface BackupRow {
  id: string;
  name: string;
  type: string;
  size: string | null;
  storage_path: string | null;
  created_at: string;
}

/**
 * Fetch all backups for admin (newest first).
 */
export async function getAdminBackups(): Promise<BackupRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("backups")
      .select("id, name, type, size, storage_path, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      const msg =
        (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error(
        "Failed to fetch backups:",
        code ? `[${code}] ${msg}` : msg,
      );
      return [];
    }
    return (data ?? []) as BackupRow[];
  } catch (err) {
    console.error("Unexpected error in getAdminBackups:", err);
    return [];
  }
}

/**
 * Delete a backup record by id.
 */
export async function deleteBackup(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("backups").delete().eq("id", id);

    if (error) {
      const msg =
        (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error(
        "Failed to delete backup:",
        code ? `[${code}] ${msg}` : msg,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in deleteBackup:", err);
    return false;
  }
}

export interface CreateBackupRepoInput {
  name: string;
  type: "full" | "incremental";
  size?: string | null;
  storage_path?: string | null;
}

/**
 * Create a backup metadata row (no file generation).
 */
export async function createBackup(
  input: CreateBackupRepoInput,
): Promise<BackupRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("backups")
      .insert({
        name: input.name,
        type: input.type,
        size: input.size ?? null,
        storage_path: input.storage_path ?? null,
      })
      .select("id, name, type, size, storage_path, created_at")
      .single();

    if (error) {
      const msg =
        (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error(
        "Failed to create backup:",
        code ? `[${code}] ${msg}` : msg,
      );
      return null;
    }
    return data as BackupRow;
  } catch (err) {
    console.error("Unexpected error in createBackup:", err);
    return null;
  }
}

export type ExtractDatabaseResult = {
  success: boolean;
  error?: string;
  content?: string;
  filename?: string;
  mimeType?: string;
};

type ProgressReporter = (event: Omit<ExtractProgressEvent, "type">) => void;

const EXTRACT_PAGE_SIZE = 1000;

const MIME_BY_FORMAT: Record<ExtractFormat, string> = {
  sql: "application/sql",
  json: "application/json",
  csv: "text/csv",
};

function extensionForFormat(format: ExtractFormat): string {
  return format;
}

function buildFilename(format: ExtractFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `database-export-${timestamp}.${extensionForFormat(format)}`;
}

function quoteIdent(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`;
}

function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Buffer.isBuffer(value)) {
    return `E'\\\\x${value.toString("hex")}'`;
  }
  if (Array.isArray(value) || typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const raw =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return "";
  }
  const columns = Object.keys(rows[0]);
  const header = columns.map(csvEscape).join(",");
  const lines = rows.map((row) =>
    columns.map((col) => csvEscape(row[col])).join(","),
  );
  return [header, ...lines].join("\n");
}

function rowsToInsertSql(
  tableName: string,
  rows: Record<string, unknown>[],
): string[] {
  if (rows.length === 0) {
    return [`-- No data in ${tableName}`, ""];
  }
  const quotedTable = quoteIdent(tableName);
  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map(quoteIdent).join(", ");
  const lines: string[] = [`-- Data for table: ${tableName}`];
  for (const row of rows) {
    const values = columns.map((col) => formatSqlValue(row[col]));
    lines.push(
      `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${values.join(", ")});`,
    );
  }
  lines.push("");
  return lines;
}

function packageContent(
  format: ExtractFormat,
  tables: { name: string; rows: Record<string, unknown>[] }[],
  meta: { source: string; note?: string },
): string {
  const generatedAt = new Date().toISOString();

  if (format === "json") {
    const payload: Record<string, unknown> = {
      generatedAt,
      source: meta.source,
      note: meta.note ?? null,
      tableCount: tables.length,
      tables: Object.fromEntries(tables.map((t) => [t.name, t.rows])),
    };
    return JSON.stringify(payload, null, 2);
  }

  if (format === "csv") {
    const parts: string[] = [
      `# Database export`,
      `# Generated at: ${generatedAt}`,
      `# Source: ${meta.source}`,
    ];
    if (meta.note) {
      parts.push(`# Note: ${meta.note}`);
    }
    parts.push("");
    for (const table of tables) {
      parts.push(`### TABLE: ${table.name}`);
      parts.push(rowsToCsv(table.rows) || "(no rows)");
      parts.push("");
    }
    return parts.join("\n");
  }

  const sqlParts: string[] = [
    `-- Database Export`,
    `-- Generated at: ${generatedAt}`,
    `-- Source: ${meta.source}`,
  ];
  if (meta.note) {
    sqlParts.push(`-- Note: ${meta.note}`);
  }
  sqlParts.push("--");
  sqlParts.push("");
  for (const table of tables) {
    sqlParts.push(...rowsToInsertSql(table.name, table.rows));
  }
  return sqlParts.join("\n");
}

/**
 * Extract database for local download (sql | json | csv).
 * Prefers DATABASE_URL / SUPABASE_DB_URL (+ pg_dump for SQL).
 * Falls back to Supabase service-role REST export of all public tables.
 */
export async function extractDatabase(options: {
  format: ExtractFormat;
  onProgress?: ProgressReporter;
}): Promise<ExtractDatabaseResult> {
  const { format, onProgress } = options;
  const report: ProgressReporter = (event) => {
    onProgress?.(event);
  };

  try {
    report({
      step: "connect",
      status: "active",
      message: "Connecting to database…",
    });

    const dbConnectionString =
      process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (dbConnectionString?.trim()) {
      if (format === "sql") {
        const dumpResult = await extractWithPgDump(dbConnectionString.trim(), report);
        if (dumpResult.success) {
          return dumpResult;
        }
        if (dumpResult.error !== "PG_DUMP_UNAVAILABLE") {
          report({
            step: "connect",
            status: "error",
            message: dumpResult.error || "pg_dump failed",
          });
          return dumpResult;
        }
      }

      return await extractWithPostgresClient(
        dbConnectionString.trim(),
        format,
        report,
      );
    }

    return await extractWithSupabaseAdmin(format, report);
  } catch (error) {
    console.error("Error extracting database:", error);
    const message =
      error instanceof Error ? error.message : "Failed to extract database";
    report({ step: "connect", status: "error", message });
    return { success: false, error: message };
  }
}

/**
 * @deprecated Prefer extractDatabase({ format: "sql" })
 */
export async function extractDatabaseAsSQL(): Promise<{
  success: boolean;
  error?: string;
  sql?: string;
}> {
  const result = await extractDatabase({ format: "sql" });
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, sql: result.content };
}

async function extractWithPgDump(
  connectionString: string,
  report: ProgressReporter,
): Promise<ExtractDatabaseResult> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  try {
    report({
      step: "connect",
      status: "done",
      message: "Connected (pg_dump)",
    });
    report({
      step: "discover",
      status: "active",
      message: "Running full schema dump…",
    });

    const { stdout } = await execFileAsync(
      "pg_dump",
      [
        "--no-owner",
        "--no-acl",
        "--format=plain",
        "--schema=public",
        connectionString,
      ],
      {
        maxBuffer: 256 * 1024 * 1024,
        windowsHide: true,
      },
    );

    report({
      step: "discover",
      status: "done",
      message: "Schema discovered",
    });
    report({
      step: "export",
      status: "done",
      message: "Full public schema exported",
    });
    report({
      step: "package",
      status: "active",
      message: "Packaging SQL download…",
    });

    const header = [
      "-- Database Export (pg_dump)",
      `-- Generated at: ${new Date().toISOString()}`,
      "-- Schema: public",
      "--",
      "",
    ].join("\n");

    const content = `${header}${stdout}`;
    report({
      step: "package",
      status: "done",
      message: "Package ready",
    });
    report({
      step: "done",
      status: "done",
      message: "Extract complete",
    });

    return {
      success: true,
      content,
      filename: buildFilename("sql"),
      mimeType: MIME_BY_FORMAT.sql,
    };
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException & {
      stderr?: string;
      message?: string;
    };
    if (err.code === "ENOENT") {
      return { success: false, error: "PG_DUMP_UNAVAILABLE" };
    }
    console.error("Error extracting with pg_dump:", error);
    const detail =
      (typeof err.stderr === "string" && err.stderr.trim()) ||
      err.message ||
      "pg_dump failed";
    return {
      success: false,
      error: `pg_dump failed: ${detail}`,
    };
  }
}

async function extractWithPostgresClient(
  connectionString: string,
  format: ExtractFormat,
  report: ProgressReporter,
): Promise<ExtractDatabaseResult> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    report({
      step: "connect",
      status: "done",
      message: "Connected via PostgreSQL client",
    });
    report({
      step: "discover",
      status: "active",
      message: "Listing public tables…",
    });

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tablesResult.rows.map(
      (row: { table_name: string }) => row.table_name,
    );

    report({
      step: "discover",
      status: "done",
      message: `Found ${tableNames.length} table${tableNames.length === 1 ? "" : "s"}`,
      total: tableNames.length,
    });

    const tables: { name: string; rows: Record<string, unknown>[] }[] = [];
    let schemaSql = "";

    if (format === "sql") {
      const enumsResult = await client.query(`
        SELECT t.typname as enum_name,
               array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname;
      `);

      const schemaParts: string[] = [];
      if (enumsResult.rows.length > 0) {
        schemaParts.push("-- ENUM TYPES");
        for (const row of enumsResult.rows) {
          const values = (row.enum_values as string[])
            .map((v) => `'${v.replace(/'/g, "''")}'`)
            .join(", ");
          schemaParts.push(
            `CREATE TYPE ${quoteIdent(row.enum_name)} AS ENUM (${values});`,
          );
        }
        schemaParts.push("");
      }

      for (const tableName of tableNames) {
        const createTableResult = await client.query(
          `
          SELECT
            'CREATE TABLE ' || quote_ident(table_name) || ' (' ||
            string_agg(
              quote_ident(column_name) || ' ' ||
              CASE
                WHEN data_type = 'USER-DEFINED' THEN udt_name
                WHEN data_type = 'ARRAY' THEN udt_name || '[]'
                ELSE
                  CASE
                    WHEN character_maximum_length IS NOT NULL
                    THEN data_type || '(' || character_maximum_length || ')'
                    WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL
                    THEN data_type || '(' || numeric_precision || ',' || numeric_scale || ')'
                    WHEN numeric_precision IS NOT NULL
                    THEN data_type || '(' || numeric_precision || ')'
                    ELSE data_type
                  END
              END ||
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
              CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
              ', '
              ORDER BY ordinal_position
            ) ||
            ');' as create_statement
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          GROUP BY table_name;
        `,
          [tableName],
        );

        if (createTableResult.rows.length > 0) {
          schemaParts.push(`-- Table: ${tableName}`);
          schemaParts.push(createTableResult.rows[0].create_statement);
          schemaParts.push("");
        }
      }
      schemaSql = schemaParts.join("\n");
    }

    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      report({
        step: "export",
        status: "active",
        message: `Exporting ${tableName}`,
        current: i + 1,
        total: tableNames.length,
        table: tableName,
      });

      const quotedTable = quoteIdent(tableName);
      const rows: Record<string, unknown>[] = [];
      let offset = 0;

      while (true) {
        const dataResult = await client.query(
          `SELECT * FROM ${quotedTable} OFFSET $1 LIMIT $2`,
          [offset, EXTRACT_PAGE_SIZE],
        );
        const page = dataResult.rows as Record<string, unknown>[];
        if (page.length === 0) {
          break;
        }
        rows.push(...page);
        offset += EXTRACT_PAGE_SIZE;
        if (page.length < EXTRACT_PAGE_SIZE) {
          break;
        }
      }

      tables.push({ name: tableName, rows });
    }

    report({
      step: "export",
      status: "done",
      message: `Exported ${tableNames.length} table${tableNames.length === 1 ? "" : "s"}`,
      total: tableNames.length,
    });
    report({
      step: "package",
      status: "active",
      message: `Packaging ${format.toUpperCase()} download…`,
    });

    let content: string;
    if (format === "sql") {
      const dataSql = tables.flatMap((table) =>
        rowsToInsertSql(table.name, table.rows),
      );
      content = [
        "-- Database Export (paginated pg client)",
        `-- Generated at: ${new Date().toISOString()}`,
        "-- Schema: public",
        "-- Note: Includes public enums, CREATE TABLE, and data. Indexes, FKs, RLS, and triggers may be omitted. Install pg_dump for a fuller dump.",
        "--",
        "",
        schemaSql,
        ...dataSql,
      ].join("\n");
    } else {
      content = packageContent(format, tables, {
        source: "paginated pg client",
      });
    }

    report({
      step: "package",
      status: "done",
      message: "Package ready",
    });
    report({
      step: "done",
      status: "done",
      message: "Extract complete",
    });

    return {
      success: true,
      content,
      filename: buildFilename(format),
      mimeType: MIME_BY_FORMAT[format],
    };
  } catch (error) {
    console.error("Error extracting with PostgreSQL client:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to extract database with PostgreSQL client",
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

/**
 * Discover public tables via PostgREST OpenAPI, then page all rows with service role.
 */
async function listPublicTablesViaOpenApi(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DATABASE_URL is not set.",
    );
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/openapi+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to discover tables via Supabase OpenAPI (${response.status})`,
    );
  }

  const spec = (await response.json()) as {
    paths?: Record<string, unknown>;
  };

  const tables = Object.keys(spec.paths ?? {})
    .map((path) => path.replace(/^\//, ""))
    .filter(
      (name) =>
        Boolean(name) &&
        !name.includes("{") &&
        !name.includes("/") &&
        !name.startsWith("rpc/"),
    )
    .sort();

  return Array.from(new Set(tables));
}

async function extractWithSupabaseAdmin(
  format: ExtractFormat,
  report: ProgressReporter,
): Promise<ExtractDatabaseResult> {
  try {
    const supabase = createSupabaseAdminClient();
    report({
      step: "connect",
      status: "done",
      message: "Connected via Supabase service role",
    });
    report({
      step: "discover",
      status: "active",
      message: "Discovering public tables…",
    });

    const tableNames = await listPublicTablesViaOpenApi();
    if (tableNames.length === 0) {
      return {
        success: false,
        error: "No public tables found to export.",
      };
    }

    report({
      step: "discover",
      status: "done",
      message: `Found ${tableNames.length} table${tableNames.length === 1 ? "" : "s"}`,
      total: tableNames.length,
    });

    const tables: { name: string; rows: Record<string, unknown>[] }[] = [];

    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      report({
        step: "export",
        status: "active",
        message: `Exporting ${tableName}`,
        current: i + 1,
        total: tableNames.length,
        table: tableName,
      });

      const rows: Record<string, unknown>[] = [];
      let from = 0;

      while (true) {
        const to = from + EXTRACT_PAGE_SIZE - 1;
        const { data, error } = await supabase
          .from(tableName as never)
          .select("*")
          .range(from, to);

        if (error) {
          return {
            success: false,
            error: `Failed to export table "${tableName}": ${error.message}`,
          };
        }

        const page = (data ?? []) as Record<string, unknown>[];
        rows.push(...page);

        if (page.length < EXTRACT_PAGE_SIZE) {
          break;
        }
        from += EXTRACT_PAGE_SIZE;
      }

      tables.push({ name: tableName, rows });
    }

    report({
      step: "export",
      status: "done",
      message: `Exported ${tableNames.length} table${tableNames.length === 1 ? "" : "s"}`,
      total: tableNames.length,
    });
    report({
      step: "package",
      status: "active",
      message: `Packaging ${format.toUpperCase()} download…`,
    });

    const content = packageContent(format, tables, {
      source: "supabase service role (REST)",
      note: "DATABASE_URL / SUPABASE_DB_URL was not set. Data-only export of public tables. Set a direct Postgres URL and install pg_dump for a fuller schema dump.",
    });

    report({
      step: "package",
      status: "done",
      message: "Package ready",
    });
    report({
      step: "done",
      status: "done",
      message: "Extract complete",
    });

    return {
      success: true,
      content,
      filename: buildFilename(format),
      mimeType: MIME_BY_FORMAT[format],
    };
  } catch (error) {
    console.error("Error extracting with Supabase admin client:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to extract database via Supabase",
    };
  }
}
