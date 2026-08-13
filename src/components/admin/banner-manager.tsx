"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createBanner, deleteBanner, moveBanner, setBannerActive } from "@/actions/banners";
import type { Banner } from "@/db/schema";
import { MAX_BANNER_IMAGE_BYTES } from "@/lib/validations";

interface BannerUploadFormProps {
  cloudinaryConfigured: boolean;
}

export function BannerUploadForm({ cloudinaryConfigured }: BannerUploadFormProps) {
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

    if (selected.size > MAX_BANNER_IMAGE_BYTES) {
      toast.error("Image is too large. Please upload a file under 8MB.");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleSubmit(formData: FormData) {
    if (!file) {
      toast.error("Please choose a banner image first.");
      return;
    }
    formData.set("image", file);

    startTransition(async () => {
      const result = await createBanner(formData);
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
        <h2 className="font-heading text-lg font-semibold text-foreground">Add a New Banner</h2>
        <p className="text-sm text-muted-foreground">
          Upload a promo image for the homepage slideshow. Recommended size: 1600×600px.
        </p>
      </div>

      {!cloudinaryConfigured && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold-foreground">
          Image uploads aren&apos;t configured yet. Add your Cloudinary credentials
          (<code className="text-xs">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="text-xs">CLOUDINARY_API_KEY</code>,{" "}
          <code className="text-xs">CLOUDINARY_API_SECRET</code>) to{" "}
          <code className="text-xs">.env.local</code> to enable uploads.
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <Label>Banner Image</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />

          {previewUrl ? (
            <div className="relative mt-2 aspect-[16/6] w-full overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a Cloudinary asset */}
              <img src={previewUrl} alt="Banner preview" className="size-full object-cover" />
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
              className="mt-2 flex aspect-[16/6] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <ImagePlus className="size-8" />
              <span className="text-sm font-medium">Click to choose an image</span>
              <span className="text-xs">JPG, PNG, WEBP, or GIF — up to 8MB</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="banner-title">Headline (optional)</Label>
            <Input id="banner-title" name="title" placeholder="Summer Whitening Special" maxLength={255} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="banner-cta-label">Button Text (optional)</Label>
            <Input id="banner-cta-label" name="ctaLabel" placeholder="Book Now" maxLength={100} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="banner-subtitle">Subtitle (optional)</Label>
          <Textarea
            id="banner-subtitle"
            name="subtitle"
            placeholder="20% off professional whitening — this month only."
            maxLength={500}
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="banner-cta-href">Button Link (optional)</Label>
          <Input
            id="banner-cta-href"
            name="ctaHref"
            placeholder="/services/teeth-whitening or /book"
            maxLength={255}
          />
        </div>

        <Button type="submit" disabled={isPending || !cloudinaryConfigured} className="gap-1.5">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {isPending ? "Uploading..." : "Upload Banner"}
        </Button>
      </form>
    </Card>
  );
}

interface BannerRowProps {
  banner: Banner;
  isFirst: boolean;
  isLast: boolean;
}

function BannerRow({ banner, isFirst, isLast }: BannerRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function runAction(action: (formData: FormData) => Promise<{ success: boolean; message: string }>, formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      if (result.success) {
        if (result.message) toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleToggle(nextActive: boolean) {
    const formData = new FormData();
    formData.set("bannerId", banner.id);
    formData.set("isActive", String(nextActive));
    runAction(setBannerActive, formData);
  }

  function handleMove(direction: "up" | "down") {
    const formData = new FormData();
    formData.set("bannerId", banner.id);
    formData.set("direction", direction);
    runAction(moveBanner, formData);
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("bannerId", banner.id);
    runAction(deleteBanner, formData);
  }

  return (
    <div className="flex flex-col gap-4 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="relative aspect-[16/7] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
        <Image
          src={banner.imageUrl}
          alt={banner.title || "Banner"}
          fill
          sizes="(min-width: 640px) 160px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{banner.title || "Untitled banner"}</p>
          <Badge variant={banner.isActive ? "default" : "secondary"}>
            {banner.isActive ? "Live" : "Hidden"}
          </Badge>
        </div>
        {banner.subtitle && (
          <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
        )}
        {banner.ctaHref && (
          <p className="text-xs text-muted-foreground">
            Links to <code>{banner.ctaHref}</code>
            {banner.ctaLabel ? ` · "${banner.ctaLabel}"` : ""}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={isPending || isFirst}
              onClick={() => handleMove("up")}
              aria-label="Move up"
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={isPending || isLast}
              onClick={() => handleMove("down")}
              aria-label="Move down"
            >
              <ArrowDown className="size-3.5" />
            </Button>
          </div>
          <Switch checked={banner.isActive} onCheckedChange={handleToggle} disabled={isPending} />
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
              <DialogTitle>Delete this banner?</DialogTitle>
              <DialogDescription>
                This permanently removes the image from Cloudinary and takes it off the site.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                Keep Banner
              </DialogClose>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete Banner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface BannerListProps {
  banners: Banner[];
}

export function BannerList({ banners }: BannerListProps) {
  if (banners.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        No banners yet. Upload one above to add a promotion.
      </Card>
    );
  }

  return (
    <Card className="p-0">
      {banners.map((banner, index) => (
        <BannerRow
          key={banner.id}
          banner={banner}
          isFirst={index === 0}
          isLast={index === banners.length - 1}
        />
      ))}
    </Card>
  );
}
