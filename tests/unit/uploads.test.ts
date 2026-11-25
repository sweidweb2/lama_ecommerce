import { describe, expect, it } from "vitest";
import {
  MAX_SERVER_ACTION_UPLOAD_BYTES,
  collectFormDataFiles,
  getServerActionTotalUploadError,
  sumUploadFileBytes,
} from "@/lib/constants/uploads";

function fakeFile(size: number, name = "x.png"): File {
  const buffer = new Uint8Array(size);
  return new File([buffer], name, { type: "image/png" });
}

describe("upload size helpers", () => {
  it("sums file sizes and ignores empty/null", () => {
    expect(
      sumUploadFileBytes([
        fakeFile(100),
        null,
        fakeFile(0, "empty.png"),
        fakeFile(50),
      ]),
    ).toBe(150);
  });

  it("collects FormData files", () => {
    const formData = new FormData();
    formData.set("name", "Shirt");
    formData.set("images", fakeFile(10, "a.png"));
    formData.set("variant_image_0", fakeFile(20, "b.png"));
    const files = collectFormDataFiles(formData);
    expect(files).toHaveLength(2);
    expect(sumUploadFileBytes(files)).toBe(30);
  });

  it("rejects combined uploads over the Server Action budget", () => {
    const a = fakeFile(Math.floor(MAX_SERVER_ACTION_UPLOAD_BYTES / 2) + 1);
    const b = fakeFile(Math.floor(MAX_SERVER_ACTION_UPLOAD_BYTES / 2) + 1);
    const error = getServerActionTotalUploadError([a, b]);
    expect(error).toMatch(/Combined images must be 3\.5 MB or smaller/);
  });

  it("allows combined uploads within budget", () => {
    const a = fakeFile(1024);
    const b = fakeFile(2048);
    expect(getServerActionTotalUploadError([a, b])).toBeNull();
  });
});
