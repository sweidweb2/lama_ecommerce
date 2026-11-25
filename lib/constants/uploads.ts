/**
 * Max single-file size for uploads that travel through Server Actions.
 * Kept under `experimental.serverActions.bodySizeLimit` (4mb) so form fields +
 * multipart overhead cannot push the request over the limit (Vercel ~4.5MB).
 *
 * The same budget is used as the max **sum** of all File parts in one Server
 * Action request (e.g. create product with product + variant images).
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

/** Sum byte sizes of File values in a FormData (or any File list). */
export function sumUploadFileBytes(files: Iterable<File | null | undefined>): number {
  let total = 0;
  for (const file of files) {
    if (file && typeof File !== "undefined" && file instanceof File && file.size > 0) {
      total += file.size;
    }
  }
  return total;
}

/** Collect every File entry from FormData (including duplicate keys). */
export function collectFormDataFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const value of formData.values()) {
    if (typeof File !== "undefined" && value instanceof File && value.size > 0) {
      files.push(value);
    }
  }
  return files;
}

/**
 * Ensure combined upload files stay within the Server Action body budget.
 * Returns an error message when over limit; otherwise null.
 */
export function getServerActionTotalUploadError(
  files: Iterable<File | null | undefined>,
): string | null {
  const total = sumUploadFileBytes(files);
  if (total > MAX_SERVER_ACTION_UPLOAD_BYTES) {
    return `Combined images must be ${MAX_SERVER_ACTION_UPLOAD_LABEL} or smaller (currently ${(total / (1024 * 1024)).toFixed(1)} MB)`;
  }
  return null;
}

export function assertServerActionTotalUploadSize(
  files: Iterable<File | null | undefined>,
): void {
  const error = getServerActionTotalUploadError(files);
  if (error) {
    throw new Error(error);
  }
}
