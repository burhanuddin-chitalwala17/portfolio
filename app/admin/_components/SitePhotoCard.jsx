"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import StatusMessage from "../../ui/StatusMessage";
import { useAsyncAction } from "../../ui/hooks/useAsyncAction";
import { adminRequest } from "../_lib/adminRequest";

const SLOTS = {
  photo: {
    title: "Photo",
    help: "Used in About, the intro, the chat icon and link previews. A waist-up portrait, 4:5, at least 1000 px tall.",
    accept: "image/jpeg,image/png,image/webp",
  },
  cutout: {
    title: "Hero cut-out",
    help: "The same photo with the background removed (transparent PNG or WebP), standing in the hero. Without one, the hero shows the photo with faded edges.",
    accept: "image/png,image/webp",
  },
};

function PhotoSlot({ kind, image, enabled }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const { busy, message, run } = useAsyncAction();
  const slot = SLOTS[kind];

  const upload = (file) =>
    run("upload", async () => {
      const body = new FormData();
      body.append("file", file);
      await adminRequest(`/api/admin/site-photo/${kind}`, { method: "PUT", body });
      router.refresh();
      return "Uploaded. The site shows it within a few seconds.";
    });

  const reset = () =>
    run("reset", async () => {
      await adminRequest(`/api/admin/site-photo/${kind}`, { method: "DELETE" });
      router.refresh();
      return "Back to the built-in image.";
    });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-fg/10 p-4 sm:flex-row">
      <div
        className={`relative aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-lg ${kind === "cutout" && image.src ? "bg-[#0b0b0d]" : "bg-fg/5"}`}
      >
        {image.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of the exact uploaded file
          <img src={image.src} alt={`Current ${slot.title.toLowerCase()}`} className="h-full w-full object-contain object-bottom" />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-xs text-fg/50">None: the hero uses the photo</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-fg">{slot.title}</p>
          <Badge tone={image.custom ? "success" : "neutral"}>{image.custom ? "Uploaded" : "Built-in"}</Badge>
        </div>
        <p className="text-xs text-fg/60">{slot.help}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={!enabled || busy !== null}>
            {busy === "upload" ? "Uploading…" : "Upload new"}
          </Button>
          {image.custom && (
            <Button variant="danger" size="sm" onClick={reset} disabled={busy !== null}>
              {busy === "reset" ? "Resetting…" : "Use built-in"}
            </Button>
          )}
        </div>
        <StatusMessage message={message} className="text-xs" />
        <input
          ref={inputRef}
          type="file"
          accept={slot.accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/**
 * The profile photo and hero cut-out shown on the site. Uploads are re-encoded on the server
 * (rotated, resized, metadata removed); "Use built-in" returns to the images in the codebase.
 * @param {{ images: { photo: {src, custom}, cutout: {src, custom} }, enabled: boolean }} props
 */
export default function SitePhotoCard({ images, enabled }) {
  return (
    <Card
      headingLevel={2}
      title="Profile photo"
      description="Location and camera details are removed from every upload. Changes go live straight away, no publish needed."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <PhotoSlot kind="photo" image={images.photo} enabled={enabled} />
        <PhotoSlot kind="cutout" image={images.cutout} enabled={enabled} />
      </div>
    </Card>
  );
}
