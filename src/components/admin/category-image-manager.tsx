"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { removeCategoryImage, uploadCategoryImage } from "@/actions/category-images";
import type { CategoryImageRow } from "@/lib/data/category-images";
import { MAX_CATEGORY_IMAGE_BYTES } from "@/lib/validations";

interface CategoryImageRowCardProps {
  row: CategoryImageRow;
  cloudinaryConfigured: boolean;
}

function CategoryImageRowCard({ row, cloudinaryConfigured }: CategoryImageRowCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(selected: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (selected.size > MAX_CATEGORY_IMAGE_BYTES) {
      toast.error("Image is too large. Please upload a file under 8MB.");
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.set("category", row.category);
    formData.set("image", file);
    startTransition(async () => {
      const result = await uploadCategoryImage(formData);
      if (result.success) {
        toast.success(result.message);
        handleFileChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleRemove() {
    const formData = new FormData();
    formData.set("category", row.category);
    startTransition(async () => {
      const result = await removeCategoryImage(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const displayUrl = previewUrl ?? row.imageUrl;

  return (
    <div className="flex flex-col gap-4 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:w-48">
        {displayUrl ? (
          previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a Cloudinary asset
            <img src={displayUrl} alt={`${row.category} preview`} className="size-full object-cover" />
          ) : (
            <Image
              src={displayUrl}
              alt={row.category}
              fill
              sizes="(min-width: 640px) 192px, 100vw"
              className="object-cover"
            />
          )
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImagePlus className="size-6" />
            <span className="text-xs">No image yet</span>
          </div>
        )}
      </div>

      <div className="flex-1">
        <p className="font-medium text-foreground">{row.category}</p>
        <p className="text-sm text-muted-foreground">
          Shown as the background photo for the {row.category} tile on the homepage.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={isPending || !cloudinaryConfigured}
              className="gap-1.5"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Save
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={isPending}
              aria-label="Cancel"
              onClick={() => {
                handleFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="size-4" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || !cloudinaryConfigured}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <ImagePlus className="size-4" />
            {row.imageUrl ? "Replace" : "Upload"}
          </Button>
        )}

        {row.imageUrl && !file && (
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={isPending}
                  aria-label={`Remove ${row.category} image`}
                  className="text-destructive hover:text-destructive"
                />
              }
            >
              <Trash2 className="size-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove the {row.category} tile image?</DialogTitle>
                <DialogDescription>
                  This permanently removes the image from Cloudinary. The tile will fall back to its
                  default icon design. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" disabled={isPending} />}>
                  Keep Image
                </DialogClose>
                <Button type="button" variant="destructive" onClick={handleRemove} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Remove Image
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

interface CategoryImageManagerProps {
  rows: CategoryImageRow[];
  cloudinaryConfigured: boolean;
}

export function CategoryImageManager({ rows, cloudinaryConfigured }: CategoryImageManagerProps) {
  return (
    <Card className="p-0">
      {!cloudinaryConfigured && (
        <div className="m-4 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold-foreground">
          Image uploads aren&apos;t configured yet. Add your Cloudinary credentials
          (<code className="text-xs">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="text-xs">CLOUDINARY_API_KEY</code>,{" "}
          <code className="text-xs">CLOUDINARY_API_SECRET</code>) to{" "}
          <code className="text-xs">.env.local</code> to enable uploads.
        </div>
      )}
      {rows.map((row) => (
        <CategoryImageRowCard key={row.category} row={row} cloudinaryConfigured={cloudinaryConfigured} />
      ))}
    </Card>
  );
}
