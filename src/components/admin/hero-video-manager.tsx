"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { removeHeroVideo, setHeroVideoActive, uploadHeroVideo } from "@/actions/hero-video";
import type { HeroVideo } from "@/db/schema";
import { MAX_HERO_VIDEO_BYTES } from "@/lib/validations";

interface HeroVideoUploadFormProps {
  cloudinaryConfigured: boolean;
  hasExistingVideo: boolean;
}

export function HeroVideoUploadForm({ cloudinaryConfigured, hasExistingVideo }: HeroVideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleFileChange(selected: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (selected.size > MAX_HERO_VIDEO_BYTES) {
      toast.error("Video is too large. Please upload a compressed clip under 40MB.");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleSubmit(formData: FormData) {
    if (!file) {
      toast.error("Please choose a video file first.");
      return;
    }
    formData.set("video", file);

    startTransition(async () => {
      const result = await uploadHeroVideo(formData);
      if (result.success) {
        toast.success(result.message);
        formRef.current?.reset();
        handleFileChange(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {hasExistingVideo ? "Replace Hero Video" : "Upload Hero Video"}
        </h2>
        <p className="text-sm text-muted-foreground">
          A short, muted, looping clip shown behind the homepage hero. Keep it under ~15 seconds
          and compressed for fast loading — 1920×1080 MP4 works best.
        </p>
      </div>

      {!cloudinaryConfigured && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold-foreground">
          Video uploads aren&apos;t configured yet. Add your Cloudinary credentials
          (<code className="text-xs">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="text-xs">CLOUDINARY_API_KEY</code>,{" "}
          <code className="text-xs">CLOUDINARY_API_SECRET</code>) to{" "}
          <code className="text-xs">.env.local</code> to enable uploads.
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <Label>Video File</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />

          {previewUrl ? (
            <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
              <video src={previewUrl} className="size-full object-cover" muted autoPlay loop playsInline />
              <Button
                type="button"
                size="icon-sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => {
                  handleFileChange(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Video className="size-8" />
              <span className="text-sm font-medium">Click to choose a video</span>
              <span className="text-xs">MP4, WEBM, or MOV — up to 40MB</span>
            </button>
          )}
        </div>

        <Button type="submit" disabled={isPending || !cloudinaryConfigured} className="gap-1.5">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {isPending ? "Uploading..." : hasExistingVideo ? "Replace Video" : "Upload Video"}
        </Button>
      </form>
    </Card>
  );
}

interface HeroVideoCurrentProps {
  video: HeroVideo;
}

export function HeroVideoCurrent({ video }: HeroVideoCurrentProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(nextActive: boolean) {
    const formData = new FormData();
    formData.set("isActive", String(nextActive));
    startTransition(async () => {
      const result = await setHeroVideoActive(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await removeHeroVideo();
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-56">
          <video
            src={video.videoUrl}
            poster={video.posterUrl || undefined}
            className="size-full object-cover"
            muted
            autoPlay
            loop
            playsInline
          />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">Current hero video</p>
            <Badge variant={video.isActive ? "default" : "secondary"}>
              {video.isActive ? "Live" : "Hidden"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Shown behind the homepage hero, looping continuously and muted by default.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{video.isActive ? "Visible" : "Hidden"}</span>
            <Switch checked={video.isActive} onCheckedChange={handleToggle} disabled={isPending} />
          </div>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  className="gap-1.5 text-destructive hover:text-destructive"
                />
              }
            >
              <Trash2 className="size-3.5" />
              Delete
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove the hero video?</DialogTitle>
                <DialogDescription>
                  This permanently removes the video from Cloudinary and the homepage will fall
                  back to its default background. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                  Keep Video
                </DialogClose>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Remove Video
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}
