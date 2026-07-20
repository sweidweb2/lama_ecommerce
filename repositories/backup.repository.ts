import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

/**
 * Extract database as SQL dump for local download.
 * Requires DATABASE_URL or SUPABASE_DB_URL. Prefers `pg_dump` when installed;
 * otherwise uses a paginated `pg` client export of public tables.
 */
export async function extractDatabaseAsSQL(): Promise<{
  success: boolean;
  error?: string;
  sql?: string;
}> {
  try {
    const dbConnectionString =
      process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (!dbConnectionString?.trim()) {
      return {
        success: false,
        error:
          "DATABASE_URL or SUPABASE_DB_URL is required for database extract. Set it in the server environment.",
      };
    }

    const dumpResult = await extractWithPgDump(dbConnectionString.trim());
    if (dumpResult.success) {
      return dumpResult;
    }
    if (dumpResult.error !== "PG_DUMP_UNAVAILABLE") {
      return dumpResult;
    }

    return await extractWithPostgresClient(dbConnectionString.trim());
  } catch (error) {
    console.error("Error extracting database:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to extract database",
    };
  }
}

const EXTRACT_PAGE_SIZE = 1000;

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

/**
 * Prefer native pg_dump when the binary is on PATH.
 * Returns error "PG_DUMP_UNAVAILABLE" when the binary is missing so callers can fall back.
 */
async function extractWithPgDump(
  connectionString: string,
): Promise<{ success: boolean; error?: string; sql?: string }> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  try {
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

    const header = [
      "-- Database Export (pg_dump)",
      `-- Generated at: ${new Date().toISOString()}`,
      "-- Schema: public",
      "--",
      "",
    ].join("\n");

    return { success: true, sql: `${header}${stdout}` };
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

/**
 * Paginated pg client export when pg_dump is not available.
 * Includes public enums + CREATE TABLE + INSERTs (not full policies/triggers).
 */
async function extractWithPostgresClient(
  connectionString: string,
): Promise<{ success: boolean; error?: string; sql?: string }> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    const sqlParts: string[] = [];

    sqlParts.push("-- Database Export (paginated pg client)");
    sqlParts.push(`-- Generated at: ${new Date().toISOString()}`);
    sqlParts.push(
      "-- Note: pg_dump was unavailable. This export includes public enums, CREATE TABLE, and data.",
    );
    sqlParts.push(
      "-- It does not include indexes, FKs, RLS policies, or triggers. Install pg_dump for a fuller dump.",
    );
    sqlParts.push("--");
    sqlParts.push("");

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

    if (enumsResult.rows.length > 0) {
      sqlParts.push("-- ENUM TYPES");
      for (const row of enumsResult.rows) {
        const values = (row.enum_values as string[])
          .map((v) => `'${v.replace(/'/g, "''")}'`)
          .join(", ");
        sqlParts.push(
          `CREATE TYPE ${quoteIdent(row.enum_name)} AS ENUM (${values});`,
        );
      }
      sqlParts.push("");
    }

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(
      (row: { table_name: string }) => row.table_name,
    );

    for (const tableName of tables) {
      const quotedTable = quoteIdent(tableName);

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
        sqlParts.push(`-- Table: ${tableName}`);
        sqlParts.push(createTableResult.rows[0].create_statement);
        sqlParts.push("");
      }

      let offset = 0;
      let totalRows = 0;
      let columns: string[] | null = null;

      while (true) {
        const dataResult = await client.query(
          `SELECT * FROM ${quotedTable} OFFSET $1 LIMIT $2`,
          [offset, EXTRACT_PAGE_SIZE],
        );
        const rows = dataResult.rows as Record<string, unknown>[];

        if (rows.length === 0) {
          break;
        }

        if (!columns) {
          columns = Object.keys(rows[0]);
          sqlParts.push(`-- Data for table: ${tableName}`);
        }

        const quotedColumns = columns.map(quoteIdent).join(", ");
        for (const row of rows) {
          const values = columns.map((col) => formatSqlValue(row[col]));
          sqlParts.push(
            `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${values.join(", ")});`,
          );
        }

        totalRows += rows.length;
        offset += EXTRACT_PAGE_SIZE;

        if (rows.length < EXTRACT_PAGE_SIZE) {
          break;
        }
      }

      if (totalRows === 0) {
        sqlParts.push(`-- No data in ${tableName}`);
      }
      sqlParts.push("");
    }

    return { success: true, sql: sqlParts.join("\n") };
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
