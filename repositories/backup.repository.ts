import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface BackupRow {
  id: string;
  name: string;
  type: string;
  size: string | null;
  storage_path: string | null;
  created_at: string;
}

export interface CreateBackupRepoInput {
  name: string;
  type: "full" | "incremental";
  size?: string | null;
  storage_path?: string | null;
}

/**
 * Fetch all backups for admin (newest first).
 */
export async function getAdminBackups(): Promise<BackupRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("backups")
      .select("id, name, type, size, storage_path, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      const msg = (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error("Failed to fetch backups:", code ? `[${code}] ${msg}` : msg);
      return [];
    }
    return (data ?? []) as BackupRow[];
  } catch (err) {
    console.error("Unexpected error in getAdminBackups:", err);
    return [];
  }
}

/**
 * Create a backup record (metadata). Actual backup file generation is external/cron.
 */
export async function createBackup(input: CreateBackupRepoInput): Promise<BackupRow | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await (supabase as any)
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
      const msg = (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error("Failed to create backup:", code ? `[${code}] ${msg}` : msg);
      return null;
    }
    return data as BackupRow;
  } catch (err) {
    console.error("Unexpected error in createBackup:", err);
    return null;
  }
}

/**
 * Delete a backup record by id.
 */
export async function deleteBackup(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await (supabase as any)
      .from("backups")
      .delete()
      .eq("id", id);

    if (error) {
      const msg = (error as { message?: string }).message ?? JSON.stringify(error);
      const code = (error as { code?: string }).code;
      console.error("Failed to delete backup:", code ? `[${code}] ${msg}` : msg);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Unexpected error in deleteBackup:", err);
    return false;
  }
}

/**
 * Extract database as SQL dump.
 * This function queries all tables and generates SQL statements.
 * Uses PostgreSQL client if connection string is available, otherwise falls back to Supabase client.
 */
export async function extractDatabaseAsSQL(): Promise<{ success: boolean; error?: string; sql?: string }> {
  try {
    // Try to use PostgreSQL client if connection string is available
    const dbConnectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (dbConnectionString) {
      return await extractWithPostgresClient(dbConnectionString);
    }

    // Fallback to Supabase client approach
    return await extractWithSupabaseClient();
  } catch (error) {
    console.error("Error extracting database:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract database",
    };
  }
}

/**
 * Extract database using PostgreSQL client (more accurate schema extraction)
 */
async function extractWithPostgresClient(connectionString: string): Promise<{ success: boolean; error?: string; sql?: string }> {
  const { Client } = await import("pg");
  const client = new Client({ connectionString });

  try {
    await client.connect();
    const sqlParts: string[] = [];

    // Add header
    sqlParts.push("-- Database Export");
    sqlParts.push(`-- Generated at: ${new Date().toISOString()}`);
    sqlParts.push("--");
    sqlParts.push("");

    // Get ENUM types
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
        const values = row.enum_values.map((v: string) => `'${v.replace(/'/g, "''")}'`).join(", ");
        sqlParts.push(`CREATE TYPE ${row.enum_name} AS ENUM (${values});`);
      }
      sqlParts.push("");
    }

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map((row: any) => row.table_name);

    // For each table, get schema and data
    for (const tableName of tables) {
      // Get CREATE TABLE statement using pg_dump-like approach
      const createTableResult = await client.query(`
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
      `, [tableName]);

      if (createTableResult.rows.length > 0) {
        sqlParts.push(`-- Table: ${tableName}`);
        sqlParts.push(createTableResult.rows[0].create_statement);
        sqlParts.push("");
      }

      // Get table data (quote identifier properly for safety)
      // Escape double quotes and wrap in quotes
      const quotedTableName = `"${tableName.replace(/"/g, '""')}"`;
      const dataResult = await client.query(`SELECT * FROM ${quotedTableName}`);
      
      if (dataResult.rows.length > 0) {
        sqlParts.push(`-- Data for table: ${tableName}`);
        for (const row of dataResult.rows) {
          const columns = Object.keys(row);
          const values = columns.map((col) => {
            const value = row[col];
            if (value === null) {
              return "NULL";
            } else if (typeof value === "string") {
              return `'${value.replace(/'/g, "''")}'`;
            } else if (typeof value === "boolean") {
              return value ? "TRUE" : "FALSE";
            } else if (value instanceof Date) {
              return `'${value.toISOString()}'`;
            } else if (Array.isArray(value)) {
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            } else {
              return String(value);
            }
          });
          sqlParts.push(
            `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});`
          );
        }
        sqlParts.push("");
      } else {
        sqlParts.push(`-- No data in ${tableName}`);
        sqlParts.push("");
      }
    }

    return { success: true, sql: sqlParts.join("\n") };
  } catch (error) {
    console.error("Error extracting with PostgreSQL client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract database with PostgreSQL client",
    };
  } finally {
    await client.end();
  }
}

/**
 * Extract database using Supabase client (fallback method)
 */
async function extractWithSupabaseClient(): Promise<{ success: boolean; error?: string; sql?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const sqlParts: string[] = [];

    // Add header
    sqlParts.push("-- Database Export");
    sqlParts.push(`-- Generated at: ${new Date().toISOString()}`);
    sqlParts.push("-- Note: This export uses Supabase client. For full schema extraction, use DATABASE_URL environment variable.");
    sqlParts.push("--");
    sqlParts.push("");

    // Get ENUM types (from known schema)
    const enumsSQL = await getEnumsSQL();
    if (enumsSQL) {
      sqlParts.push("-- ENUM TYPES");
      sqlParts.push(enumsSQL);
      sqlParts.push("");
    }

    // Get tables list
    const tablesList = await getTablesList(supabase);
    
    if (!tablesList || tablesList.length === 0) {
      return { success: false, error: "No tables found in database" };
    }

    // For each table, get data
    for (const tableName of tablesList) {
      const tableData = await getTableData(supabase, tableName);
      if (tableData) {
        sqlParts.push(`-- Data for table: ${tableName}`);
        sqlParts.push(tableData);
        sqlParts.push("");
      }
    }

    return { success: true, sql: sqlParts.join("\n") };
  } catch (error) {
    console.error("Error extracting with Supabase client:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract database with Supabase client",
    };
  }
}

/**
 * Get list of tables in the public schema
 */
async function getTablesList(supabase: any): Promise<string[]> {
  try {
    const knownTables = [
      "profiles",
      "user_addresses",
      "brands",
      "categories",
      "products",
      "product_images",
      "customised_products",
      "wishlists",
      "carts",
      "cart_items",
      "reviews",
      "product_questions",
      "product_answers",
      "orders",
      "order_items",
      "payments",
      "shipping_zones",
      "shipping_fees",
      "shipments",
      "product_views",
      "product_stats",
      "leads",
      "contact_us",
      "promo_codes",
      "backups",
    ];

    const existingTables: string[] = [];
    for (const table of knownTables) {
      try {
        const { error } = await (supabase as any).from(table).select("id").limit(1);
        if (!error) {
          existingTables.push(table);
        }
      } catch {
        // Table doesn't exist or can't be accessed
      }
    }

    return existingTables;
  } catch (error) {
    console.error("Error getting tables list:", error);
    return [];
  }
}

/**
 * Get ENUM types SQL
 */
async function getEnumsSQL(): Promise<string | null> {
  try {
    const enums = [
      { name: "profile_role", values: ["'user'", "'admin'"] },
      { name: "order_status", values: ["'pending'", "'processing'", "'packed'", "'shipped'", "'delivered'", "'returned'", "'cancelled'"] },
      { name: "payment_status", values: ["'pending'", "'paid'", "'failed'", "'refunded'"] },
      { name: "review_status", values: ["'pending'", "'approved'", "'rejected'"] },
      { name: "contact_status", values: ["'new'", "'read'", "'replied'", "'resolved'"] },
      { name: "discount_type", values: ["'percentage'", "'fixed'"] },
    ];

    const sqlParts: string[] = [];
    for (const enumType of enums) {
      sqlParts.push(`CREATE TYPE ${enumType.name} AS ENUM (${enumType.values.join(", ")});`);
    }

    return sqlParts.join("\n");
  } catch (error) {
    console.error("Error getting enums SQL:", error);
    return null;
  }
}

/**
 * Get table data as INSERT statements
 */
async function getTableData(supabase: any, tableName: string): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any)
      .from(tableName)
      .select("*");

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return null;
    }

    if (!data || data.length === 0) {
      return `-- No data in ${tableName}`;
    }

    const insertStatements: string[] = [];
    for (const row of data) {
      const columns = Object.keys(row);
      const values = columns.map((col) => {
        const value = row[col];
        if (value === null) {
          return "NULL";
        } else if (typeof value === "string") {
          return `'${value.replace(/'/g, "''")}'`;
        } else if (typeof value === "boolean") {
          return value ? "TRUE" : "FALSE";
        } else if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        } else if (Array.isArray(value)) {
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        } else {
          return String(value);
        }
      });

      insertStatements.push(
        `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});`
      );
    }

    return insertStatements.join("\n");
  } catch (error) {
    console.error(`Error getting table data for ${tableName}:`, error);
    return null;
  }
}