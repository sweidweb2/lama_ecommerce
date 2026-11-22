import { extractDatabaseService } from "@/services/backup.service";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  extractFormatSchema,
  type ExtractStreamEvent,
} from "@/lib/validators/backup/extract";

/**
 * GET /api/admin/backups/extract?format=sql|json|csv
 * Streams NDJSON progress events, then a complete event with file content.
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentAuthUserFromAction();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await requireAdmin();
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsedFormat = extractFormatSchema.safeParse(
      searchParams.get("format") ?? "sql",
    );
    if (!parsedFormat.success) {
      return Response.json(
        { error: "Invalid format. Use sql, json, or csv." },
        { status: 400 },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: ExtractStreamEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          const result = await extractDatabaseService({
            format: parsedFormat.data,
            onProgress: (progress) => {
              send({ type: "progress", ...progress });
            },
          });

          if (!result.success || !result.content || !result.filename) {
            send({
              type: "error",
              error: result.error || "Failed to extract database",
            });
            controller.close();
            return;
          }

          send({
            type: "complete",
            filename: result.filename,
            mimeType: result.mimeType || "application/octet-stream",
            content: result.content,
          });
          controller.close();
        } catch (error) {
          console.error("Error streaming database extract:", error);
          send({
            type: "error",
            error:
              error instanceof Error
                ? error.message
                : "Internal server error",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error in extract database API:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
