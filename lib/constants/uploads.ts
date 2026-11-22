/**
 * Max single-file size for uploads that travel through Server Actions.
 * Kept under `experimental.serverActions.bodySizeLimit` (4mb) so form fields +
 * multipart overhead cannot push the request over the limit (Vercel ~4.5MB).
 */
export const MAX_SERVER_ACTION_UPLOAD_BYTES = Math.floor(3.5 * 1024 * 1024);

export const MAX_SERVER_ACTION_UPLOAD_LABEL = "3.5 MB";

export function assertServerActionUploadSize(file: File, label = "File"): void {
  if (file.size > MAX_SERVER_ACTION_UPLOAD_BYTES) {
    throw new Error(
      `${label} must be ${MAX_SERVER_ACTION_UPLOAD_LABEL} or smaller`,
    );
  }
}
