import "server-only";
import { randomUUID } from "crypto";
import { cache } from "react";
import sharp from "sharp";
import { z } from "zod";
import { profile as defaultProfile } from "../../data/siteData";
import { readWithRetry } from "../db/client";
import { readSetting, writeSetting } from "../settings/store";
import { deleteObject, isStorageConfigured, putObject } from "../storage/storage";

/*
 * The profile photo, configurable from Admin → Content. Two images:
 * - "photo": the portrait used in About, the chat icon, the intro and link previews.
 * - "cutout": a background-removed version for the hero (transparent PNG or WebP).
 * Uploads are re-encoded (auto-rotated, resized, metadata stripped) and kept in storage; anything
 * not uploaded falls back to the images that ship with the site (app/data/siteData.js).
 */

// The photo is a JPEG because link previews (LinkedIn, WhatsApp…) don't all accept WebP; the
// cut-out needs transparency, so it's a WebP.
export const PHOTO_KINDS = Object.freeze({
  photo: { label: "Photo", maxSide: 1600, needsTransparency: false, format: "jpeg" },
  cutout: { label: "Hero cut-out", maxSide: 1600, needsTransparency: true, format: "webp" },
});

const ENCODERS = {
  jpeg: (image) => image.flatten({ background: "#0b0b0d" }).jpeg({ quality: 88, mozjpeg: true }),
  webp: (image) => image.webp({ quality: 88, alphaQuality: 100 }),
};

const SETTINGS_KEY = "site_photo";
const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const storedImage = z.object({
  key: z.string().max(200),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  version: z.string().max(40),
});
const SitePhotoSchema = z.object({ photo: storedImage.nullable(), cutout: storedImage.nullable() });
const NONE = Object.freeze({ photo: null, cutout: null });

export class SitePhotoError extends Error {}

export function getStoredSitePhotos() {
  return readSetting(SETTINGS_KEY, SitePhotoSchema, NONE);
}

const publicUrl = (kind, image) => `/api/site-photo/${kind}?v=${image.version}`;

/**
 * The portrait the site shows, uploaded or built in. Cached per request; never fails (falls back
 * to the built-in images if settings can't be read).
 * @returns {Promise<{src: string, alt: string, cutout: string | null, cutoutWidth?: number, cutoutHeight?: number, custom: boolean}>}
 */
export const getSitePortrait = cache(async function getSitePortrait() {
  const builtIn = { ...defaultProfile.portrait, custom: false };
  let stored = NONE;
  try {
    stored = await readWithRetry(() => getStoredSitePhotos(), { timeoutMs: 4000, label: "Loading the profile photo" });
  } catch (error) {
    console.error("Loading the profile photo failed, using the built-in one:", error);
  }
  if (!stored.photo && !stored.cutout) return builtIn;
  // Once anything is uploaded, the built-in pictures are no longer mixed in: an uploaded photo
  // without its own cut-out shows in the hero as a softly faded photo instead.
  return {
    alt: builtIn.alt,
    src: stored.photo ? publicUrl("photo", stored.photo) : builtIn.src,
    cutout: stored.cutout ? publicUrl("cutout", stored.cutout) : null,
    cutoutWidth: stored.cutout?.width,
    cutoutHeight: stored.cutout?.height,
    custom: true,
  };
});

/**
 * What each admin slot shows now, and whether it's an upload. The cut-out slot is empty when a
 * photo was uploaded without one (the hero then shows the photo).
 */
export async function getSitePhotoSlots() {
  const stored = await getStoredSitePhotos();
  const builtIn = defaultProfile.portrait;
  return {
    photo: stored.photo ? { src: publicUrl("photo", stored.photo), custom: true } : { src: builtIn.src, custom: false },
    cutout: stored.cutout
      ? { src: publicUrl("cutout", stored.cutout), custom: true }
      : { src: stored.photo ? null : builtIn.cutout, custom: false },
  };
}

/** Content with the site's current portrait in place of whatever the content version recorded. */
export function withSitePortrait(content, portrait) {
  const { custom, ...image } = portrait;
  return { ...content, profile: { ...content.profile, portrait: image } };
}

/** Re-encodes an upload: honours EXIF rotation, then drops all metadata (location, camera…). */
async function processImage(buffer, { maxSide, needsTransparency, format }) {
  let image = sharp(buffer, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  if (needsTransparency && !metadata.hasAlpha) {
    throw new SitePhotoError("The hero cut-out needs a transparent background (a PNG or WebP with the background removed).");
  }
  image = image.resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true });
  const { data, info } = await ENCODERS[format](image).toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Stores a new photo or cut-out, replacing (and deleting) the previous upload of that kind. */
export async function saveSitePhoto(kind, file) {
  const definition = PHOTO_KINDS[kind];
  if (!definition) throw new SitePhotoError("Unknown photo type.");
  if (!isStorageConfigured()) throw new SitePhotoError("Connect storage first.");
  if (!ACCEPTED_TYPES.has(file.type)) throw new SitePhotoError("Use a JPEG, PNG or WebP image.");
  if (file.size > MAX_BYTES) throw new SitePhotoError("Images must be 4 MB or smaller.");

  let processed;
  try {
    processed = await processImage(Buffer.from(await file.arrayBuffer()), definition);
  } catch (error) {
    if (error instanceof SitePhotoError) throw error;
    throw new SitePhotoError("That file couldn't be read as an image.");
  }

  const version = randomUUID();
  const key = `site/${kind}-${version}.${definition.format === "jpeg" ? "jpg" : "webp"}`;
  await putObject(key, processed.data, `image/${definition.format}`);
  const current = await getStoredSitePhotos();
  await writeSetting(SETTINGS_KEY, { ...current, [kind]: { key, width: processed.width, height: processed.height, version } });
  if (current[kind]) await deleteObject(current[kind].key).catch(() => {});
}

/** Goes back to the built-in image for this kind. */
export async function resetSitePhoto(kind) {
  if (!PHOTO_KINDS[kind]) throw new SitePhotoError("Unknown photo type.");
  const current = await getStoredSitePhotos();
  if (!current[kind]) return;
  await writeSetting(SETTINGS_KEY, { ...current, [kind]: null });
  await deleteObject(current[kind].key).catch(() => {});
}
