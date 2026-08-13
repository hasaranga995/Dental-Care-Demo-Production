"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { uploadAndSyncKnowledgePDF } from "@/actions/knowledge";
import type { KnowledgeDocument } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

interface KnowledgeManagerProps {
  activeDoc: KnowledgeDocument | null;
  cloudinaryConfigured: boolean;
}

export function KnowledgeManager({ activeDoc, cloudinaryConfigured }: KnowledgeManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function acceptFile(selected: File | null) {
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      toast.error("PDF is too large. Please upload a file under 20MB.");
      return;
    }
    setFile(selected);
    if (!title.trim()) {
      setTitle(selected.name.replace(/\.pdf$/i, ""));
    }
  }

  function handleUpload() {
    if (!file) {
      toast.error("Please choose a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title.trim() || file.name);

    setProgress(12);
    const tick = window.setInterval(() => {
      setProgress((current) => (current >= 88 ? current : current + 7));
    }, 280);

    startTransition(async () => {
      const result = await uploadAndSyncKnowledgePDF(formData);
      window.clearInterval(tick);
      setProgress(100);

      if (result.success) {
        toast.success(result.message);
        setFile(null);
        setTitle("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.message);
      }

      window.setTimeout(() => setProgress(0), 600);
    });
  }

  return (
    <div className="space-y-8">
      {activeDoc ? (
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/15 px-2.5 py-1 text-xs font-semibold text-brand-teal">
                <CheckCircle2 className="size-3.5" />
                Active Knowledge Version
              </div>
              <h2 className="font-heading text-lg font-semibold text-foreground">{activeDoc.title}</h2>
              <p className="text-sm text-muted-foreground">
                Uploaded{" "}
                {new Date(activeDoc.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {" · "}
                {activeDoc.extractedText.length.toLocaleString()} characters extracted
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                render={<a href={activeDoc.cloudinaryUrl} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink className="size-3.5" />
                View PDF
              </Button>

              <Dialog>
                <DialogTrigger
                  render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}
                >
                  <Eye className="size-3.5" />
                  Preview Text
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Extracted knowledge preview</DialogTitle>
                    <DialogDescription>
                      Plain text parsed from “{activeDoc.title}” and injected into the chatbot
                      system prompt.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-border bg-secondary/40 p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                      {activeDoc.extractedText}
                    </pre>
                  </div>
                  <DialogFooter>
                    <DialogClose render={<Button type="button" variant="outline" />}>
                      Close
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed p-6 text-sm text-muted-foreground">
          No active knowledge PDF yet. Upload one below to power the Live Chat assistant with your
          hospital services, pricing, and policies.
        </Card>
      )}

      <Card className="p-5">
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Upload Knowledge PDF
          </h2>
          <p className="text-sm text-muted-foreground">
            Uploading a new PDF deactivates the previous version and immediately updates the chatbot
            knowledge base.
          </p>
        </div>

        {!cloudinaryConfigured && (
          <div className="mb-4 rounded-lg border border-brand-teal/30 bg-brand-teal/10 p-3 text-sm text-foreground">
            Cloudinary credentials are missing. Add them to <code className="text-xs">.env.local</code>{" "}
            before uploading.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="knowledge-title">Document title</Label>
            <Input
              id="knowledge-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Hospital Services & Pricing Guide 2026"
              maxLength={200}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            disabled={isPending || !cloudinaryConfigured}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              acceptFile(event.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
              isDragging
                ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
              (isPending || !cloudinaryConfigured) && "cursor-not-allowed opacity-60"
            )}
          >
            {file ? (
              <>
                <FileText className="size-8 text-brand-teal" />
                <span className="text-sm font-semibold text-foreground">{file.name}</span>
                <span className="text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </>
            ) : (
              <>
                <Upload className="size-8" />
                <span className="text-sm font-semibold">Drag & drop a PDF here, or click to browse</span>
                <span className="text-xs">PDF only · up to 20MB</span>
              </>
            )}
          </button>

          {file && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => acceptFile(null)}>
                <X className="size-3.5" />
                Clear
              </Button>
            </div>
          )}

          {progress > 0 && (
            <div className="space-y-1.5">
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-brand-teal transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isPending ? "Uploading, extracting text, and syncing chatbot knowledge…" : "Done"}
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleUpload}
            disabled={isPending || !file || !cloudinaryConfigured}
            className="gap-1.5"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {isPending ? "Syncing…" : "Upload & Sync Knowledge"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
