import Image from "next/image";
import Link from "next/link";
import { Award, CalendarCheck, Clock3, Languages, Sparkles, Stethoscope } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamHeroSlideshow } from "@/components/team/team-hero-slideshow";
import { CLINIC } from "@/lib/clinic-config";
import { displayDoctorName, type TeamMember } from "@/lib/data/team";
import { cn } from "@/lib/utils";

export function TeamView({ members }: { members: TeamMember[] }) {
  return (
    <div className="bg-[#F4FAF9]">
      <TeamHeroSlideshow>
        <Badge
          variant="secondary"
          className="mb-4 h-auto border-white/25 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white [text-shadow:0_1px_12px_rgba(7,24,32,0.4)]"
        >
          Hospital specialists
        </Badge>
        <h1 className="text-balance font-heading text-3xl font-semibold !text-white [text-shadow:0_2px_24px_rgba(7,24,32,0.55)] sm:text-4xl md:text-5xl">
          Meet the Team
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-white/90 [text-shadow:0_1px_16px_rgba(7,24,32,0.45)]">
          Board-certified clinicians at {CLINIC.name} — each with a defined specialty, clinic
          schedule, and a calm, hospital-grade approach to care.
        </p>
      </TeamHeroSlideshow>

      <div className="page-container space-y-8 py-12 sm:py-16">
        {members.map((member, index) => (
          <TeamProfile key={member.id} member={member} index={index} />
        ))}
      </div>
    </div>
  );
}

function TeamProfile({ member, index }: { member: TeamMember; index: number }) {
  const name = displayDoctorName(member.name);

  return (
    <FadeIn delay={Math.min(index * 0.06, 0.24)}>
      <article
        id={member.id}
        className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-[0_18px_50px_-32px_rgba(13,79,92,0.35)] backdrop-blur-xl"
      >
        <div className="grid gap-0 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div className="relative aspect-[4/5] bg-secondary lg:aspect-auto lg:min-h-[28rem]">
            <Image
              src={member.image}
              alt={name}
              fill
              sizes="(min-width: 1024px) 18rem, 100vw"
              className="object-cover object-top"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#0D4F5C]/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-white/10"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 lg:hidden">
              <p className="font-heading text-2xl font-semibold text-white">{name}</p>
              <p className="mt-1 text-sm text-white/85">{member.specialty}</p>
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            <div className="hidden lg:block">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-navy uppercase">
                <Award className="size-3 text-brand-teal" />
                Specialist
              </span>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-foreground">{name}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-primary">
                <Stethoscope className="size-4" />
                {member.specialty}
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base lg:mt-5">
              {member.bio}
            </p>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Award className="size-3.5 text-brand-teal" />
                  Credentials
                </dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {member.credentials.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#dceeed] bg-[#F3FAF9] px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Languages className="size-3.5 text-brand-teal" />
                  Languages
                </dt>
                <dd className="mt-2 text-sm text-foreground">{member.languages.join(" · ")}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Sparkles className="size-3.5 text-brand-teal" />
                Clinical focus
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {member.focus.map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-brand-teal/15 px-2.5 py-1 text-xs font-medium text-brand-navy"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Clock3 className="size-3.5 text-brand-teal" />
                Clinic hours
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {member.hours.map((day) => (
                  <li
                    key={day.key}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                      day.isOff
                        ? "bg-muted/60 text-muted-foreground"
                        : "bg-[#F3FAF9] font-medium text-foreground"
                    )}
                  >
                    <span>{day.label}</span>
                    <span>{day.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7">
              <Button
                size="lg"
                variant="accent"
                render={<Link href={`/book?doctor=${member.id}`} />}
              >
                <CalendarCheck className="size-4" />
                Book with {name}
              </Button>
            </div>
          </div>
        </div>
      </article>
    </FadeIn>
  );
}
