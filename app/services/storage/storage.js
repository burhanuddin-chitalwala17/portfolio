import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REQUIRED_VARIABLES = ["S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET"];
const LINK_LIFETIME_SECONDS = 5 * 60;

let client;

export function isStorageConfigured() {
  return REQUIRED_VARIABLES.every((name) => Boolean(process.env[name]));
}

/**
 * S3-compatible object storage. Supabase Storage, Cloudflare R2 and AWS S3 all speak this API,
 * so switching providers only means changing the S3_* variables.
 */
function getClient() {
  if (!isStorageConfigured()) {
    throw new Error("Object storage is not configured. Set the S3_* environment variables.");
  }
  if (!client) {
    client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "auto",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export async function putObject(key, body, contentType) {
  await getClient().send(
    new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}

export async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
}

/** A short-lived link to a stored file. `downloadName` makes the browser save it instead of showing it. */
export async function getObjectUrl(key, { downloadName } = {}) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: downloadName
      ? `attachment; filename="${downloadName.replace(/"/g, "")}"`
      : undefined,
  });
  return getSignedUrl(getClient(), command, { expiresIn: LINK_LIFETIME_SECONDS });
}
