"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleCheckBig,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitContactForm, initialContactActionState } from "@/actions/contact";
import { useDemoPlan } from "@/components/demo/demo-plan-provider";
import { cn } from "@/lib/utils";

const TOPICS = [
  { id: "general", label: "General Inquiry" },
  { id: "cosmetic", label: "Invisalign & Cosmetic" },
  { id: "vip", label: "VIP Concierge" },
  { id: "urgent", label: "Urgent Care" },
  { id: "billing", label: "Insurance & Billing" },
  { id: "other", label: "Other" },
] as const;

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", emoji: "💬" },
  { id: "phone", label: "Phone Call", emoji: "📞" },
  { id: "email", label: "Email", emoji: "✉️" },
] as const;

type ChannelId = (typeof CHANNELS)[number]["id"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const { has } = useDemoPlan();
  const topics = TOPICS.filter((topic) => has("vip") || topic.id !== "vip");
  const channels = CHANNELS.filter((item) => has("whatsapp") || item.id !== "whatsapp");
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialContactActionState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [topicId, setTopicId] = useState<string>("general");
  const [customSubject, setCustomSubject] = useState("");
  const [channel, setChannel] = useState<ChannelId>(has("whatsapp") ? "whatsapp" : "phone");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [successDismissed, setSuccessDismissed] = useState(false);

  const selectedTopic = TOPICS.find((topic) => topic.id === topicId);
  const isOther = topicId === "other";
  const subjectValue = isOther
    ? customSubject.trim()
    : (selectedTopic?.label ?? "");

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
      setTopicId("general");
      setCustomSubject("");
      setChannel(has("whatsapp") ? "whatsapp" : "phone");
      setClientErrors({});
      setSuccessDismissed(false);
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state]);

  const fieldError = (name: string) =>
    clientErrors[name] ?? state.fieldErrors?.[name as keyof typeof state.fieldErrors];

  function validateField(name: string, value: string) {
    let message = "";
    if (name === "name" && value.trim().length < 2) message = "Please enter your full name.";
    if (name === "email" && !EMAIL_RE.test(value.trim())) {
      message = "Please enter a valid email address.";
    }
    if (name === "phone" && value.trim().length < 7) {
      message = "Please enter a valid phone number.";
    }
    if (name === "subject" && value.trim().length < 3) message = "Please enter a subject.";
    if (name === "message" && value.trim().length < 10) {
      message = "Please enter a message of at least 10 characters.";
    }
    setClientErrors((prev) => ({ ...prev, [name]: message }));
  }

  return (
    <div className="relative">
      <form ref={formRef} action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="subject-select">Subject</Label>
          <Select
            value={topicId}
            onValueChange={(value) => {
              if (!value) return;
              setTopicId(value);
              setClientErrors((prev) => ({ ...prev, subject: "" }));
            }}
          >
            <SelectTrigger
              id="subject-select"
              className="h-11 w-full bg-white/80 px-3 data-[size=default]:h-11"
              aria-invalid={Boolean(fieldError("subject"))}
            >
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false} className="w-(--anchor-width)">
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id} className="min-h-10">
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="subject" value={subjectValue} />
          {isOther && (
            <Input
              id="custom-subject"
              value={customSubject}
              onChange={(event) => setCustomSubject(event.target.value)}
              onBlur={(event) => validateField("subject", event.target.value)}
              placeholder="Tell us the subject"
              aria-invalid={Boolean(fieldError("subject"))}
              className="mt-2 h-11 bg-white/80"
            />
          )}
          {fieldError("subject") && (
            <p className="text-xs text-destructive">{fieldError("subject")}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="name"
            name="name"
            label="Full Name"
            placeholder="Jane Appleseed"
            icon={User}
            error={fieldError("name")}
            onBlur={(value) => validateField("name", value)}
          />
          <Field
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="jane@example.com"
            icon={Mail}
            error={fieldError("email")}
            onBlur={(value) => validateField("email", value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{has("whatsapp") ? "Phone / WhatsApp Number" : "Phone Number"}</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#0D4F5C]/55" />
            <span className="pointer-events-none absolute top-1/2 left-9 -translate-y-1/2 rounded-md bg-[#0D4F5C]/8 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#0D4F5C]">
              +94
            </span>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="77 123 4567"
              required
              aria-invalid={Boolean(fieldError("phone"))}
              className="h-11 bg-white/80 pl-[4.75rem]"
              onBlur={(event) => validateField("phone", event.target.value)}
            />
          </div>
          {fieldError("phone") && <p className="text-xs text-destructive">{fieldError("phone")}</p>}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Preferred Response Channel</p>
          <input type="hidden" name="preferredChannel" value={channel} />
          <div className="grid grid-cols-3 gap-2">
            {channels.map((item) => {
              const selected = channel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setChannel(item.id)}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-medium transition-all",
                    selected
                      ? "border-amber-400/70 bg-amber-50 text-[#0D4F5C] shadow-sm"
                      : "border-[#dceeed] bg-white/70 text-muted-foreground hover:border-[#5ec8c0]/50"
                  )}
                >
                  <span aria-hidden>{item.emoji}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.id === "phone" ? "Call" : item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            rows={5}
            placeholder="Tell us how we can assist you..."
            required
            aria-invalid={Boolean(fieldError("message"))}
            className="min-h-32 bg-white/80"
            onBlur={(event) => validateField("message", event.target.value)}
          />
          {fieldError("message") && (
            <p className="text-xs text-destructive">{fieldError("message")}</p>
          )}
        </div>

        {state.status === "error" && !state.fieldErrors && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="h-12 w-full bg-[#0D4F5C] text-white hover:bg-[#0a3f49] sm:w-auto"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {isPending ? "Sending..." : "Send Message"}
          </Button>
        </motion.div>
      </form>

      <AnimatePresence>
        {state.status === "success" && !successDismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[#071820]/70 p-6 backdrop-blur-md"
          >
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white p-6 text-center shadow-2xl">
              <CircleCheckBig className="mx-auto size-10 text-emerald-600" />
              <p className="mt-3 font-heading text-lg font-semibold text-[#0D4F5C]">
                Message received
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {state.message}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#0D4F5C]">
                <MessageCircle className="size-3.5" />
                Concierge desk standing by
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => setSuccessDismissed(true)}
              >
                Send another message
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  icon: Icon,
  type = "text",
  error,
  onBlur,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  icon: typeof User;
  type?: string;
  error?: string;
  onBlur: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#0D4F5C]/55" />
        <Input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          required
          aria-invalid={Boolean(error)}
          className="h-11 bg-white/80 pl-10"
          onBlur={(event) => onBlur(event.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
