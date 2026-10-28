import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REQUIRED_VARIABLES = ["S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET"];
const LINK_LIFETIME_SECONDS = 5 * 60;

let client;

/** A storage failure explained for the admin panel, with what to check. */
export class StorageError extends Error {
  name = "StorageError";
}

// S3 error names → what's usually wrong with the S3_* settings.
const STORAGE_PROBLEMS = {
  NoSuchBucket: () => `the bucket "${process.env.S3_BUCKET}" doesn't exist. Create it, or fix S3_BUCKET.`,
  InvalidAccessKeyId: () => "the access key ID isn't recognised. Check S3_ACCESS_KEY_ID.",
  SignatureDoesNotMatch: () =>
    "the secret key or region doesn't match. Check S3_SECRET_ACCESS_KEY, and that S3_REGION is the region shown on the storage provider's S3 settings page.",
  AuthorizationHeaderMalformed: () => "the region doesn't match the storage project. Check S3_REGION.",
  AccessDenied: () => "the access key isn't allowed to write to this bucket.",
  InvalidRequest: () => "the request was refused. Check S3_ENDPOINT and S3_REGION.",
};

/** Turns an S3 SDK error into a StorageError that says what to fix. */
function explain(error) {
  const problem = STORAGE_PROBLEMS[error?.name ?? error?.Code];
  if (problem) return new StorageError(`Storage rejected the file: ${problem()}`, { cause: error });
  if (["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(error?.code ?? error?.cause?.code)) {
    return new StorageError("Couldn't reach the storage service. Check S3_ENDPOINT.", { cause: error });
  }
  const status = error?.$metadata?.httpStatusCode;
  return new StorageError(`Storage failed${status ? ` (HTTP ${status})` : ""}: ${error?.name ?? "Error"} — ${error?.message ?? ""}`.slice(0, 300), {
    cause: error,
  });
}

async function send(command) {
  try {
    return await getClient().send(command);
  } catch (error) {
    throw explain(error);
  }
}

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
  await send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteObject(key) {
  await send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
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
