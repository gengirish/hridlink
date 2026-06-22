import { issueSignedToken, presignUrl, put } from "@vercel/blob";

function cleanEnv(val: string | undefined): string | undefined {
  if (val == null) return undefined;
  const cleaned = val.replace(/^\uFEFF/, "").replace(/\u200b/g, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

function getBlobToken(): string {
  const token = cleanEnv(process.env.BLOB_READ_WRITE_TOKEN);
  if (!token) {
    throw new Error("Vercel Blob is not configured — set BLOB_READ_WRITE_TOKEN on Fly");
  }
  return token;
}

/** Presigned URL TTL — keep in sync with in-process cache in index.ts */
export const ECG_SIGNED_URL_TTL_SEC = 3600;
export const ECG_SIGNED_URL_TTL_MS = ECG_SIGNED_URL_TTL_SEC * 1000;

export async function uploadEcgBlob(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await put(pathname, body, {
    access: "private",
    contentType,
    token: getBlobToken(),
  });
}

export async function getPresignedEcgBlobUrl(pathname: string): Promise<string> {
  const token = getBlobToken();
  const signed = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil: Date.now() + ECG_SIGNED_URL_TTL_MS,
    token,
  });
  const { presignedUrl } = await presignUrl(
    {
      clientSigningToken: signed.clientSigningToken,
      delegationToken: signed.delegationToken,
    },
    {
      operation: "get",
      pathname,
      access: "private",
    }
  );
  return presignedUrl;
}
