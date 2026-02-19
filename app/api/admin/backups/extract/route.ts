import { NextResponse } from "next/server";
import { extractDatabaseService } from "@/services/backup.service";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";

/**
 * GET /api/admin/backups/extract
 * Extract database as SQL file and return it for download
 */
export async function GET() {
  try {
    // Authorization check: User must be logged in
    const user = await getCurrentAuthUserFromAction();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract database
    const result = await extractDatabaseService();

    if (!result.success || !result.sql) {
      return NextResponse.json(
        { error: result.error || "Failed to extract database" },
        { status: 500 }
      );
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `database-export-${timestamp}.sql`;

    // Return SQL file as download
    return new NextResponse(result.sql, {
      status: 200,
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in extract database API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
