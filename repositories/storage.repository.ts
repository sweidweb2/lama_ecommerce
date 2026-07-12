import { createSupabaseServerActionClient } from "@/lib/supabase/server";

/**
 * Upload a file to a public storage bucket.
 */
export async function uploadPublicFile(
  bucket: string,
  path: string,
  file: File | Blob,
  contentType: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType,
    });

    if (error) {
      console.error(`Error uploading to ${bucket}/${path}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`Unexpected error uploading to ${bucket}/${path}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Get the public URL for an object in a public storage bucket.
 */
export async function getPublicUrl(
  bucket: string,
  path: string,
): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerActionClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch (error) {
    console.error(`Unexpected error getting public URL for ${bucket}/${path}:`, error);
    return null;
  }
}

/**
 * Remove one or more objects from a storage bucket.
 */
export async function removeFiles(
  bucket: string,
  paths: string[],
): Promise<{ success: boolean; error?: string }> {
  if (paths.length === 0) {
    return { success: true };
  }

  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.error(`Error removing files from ${bucket}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error(`Unexpected error removing files from ${bucket}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Remove failed",
    };
  }
}

/**
 * Extract a storage object path from a public URL for a given bucket segment
 * (e.g. "/brands/" or "/products/").
 */
export function extractStorageObjectPath(
  publicUrl: string,
  bucketSegment: string,
): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/${bucketSegment}/`;
    const pathIndex = url.pathname.lastIndexOf(marker);
    if (pathIndex === -1) {
      return null;
    }
    // Includes "<bucket>/..."
    return url.pathname.substring(pathIndex + 1);
  } catch {
    return null;
  }
}
