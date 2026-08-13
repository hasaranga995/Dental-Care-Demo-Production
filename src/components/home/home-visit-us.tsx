import { MapPin, Phone } from "lucide-react";
import { CLINIC, getClinicFullAddress, getOperatingHoursList } from "@/lib/clinic-config";

/** Presence plan: hours, address, and phone live on the one-page homepage. */
export function HomeVisitUs() {
  const hours = getOperatingHoursList();
  const address = getClinicFullAddress();

  return (
    <section className="section-padding bg-white">
      <div className="page-container grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-teal uppercase">
            Visit the hospital
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground">Hours, address &amp; phone</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Call reception to reserve a chair. This brochure site keeps the essentials in one place.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F3FAF9] text-brand-navy">
                <MapPin className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Address</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F3FAF9] text-brand-navy">
                <Phone className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Reception</p>
                <a href={`tel:${CLINIC.phoneRaw}`} className="mt-0.5 block text-sm font-medium text-brand-navy">
                  {CLINIC.phone}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">Emergency: {CLINIC.emergencyPhone}</p>
              </div>
            </div>
          </div>

          <ul className="mt-6 space-y-2 text-sm">
            {hours.map((day) => (
              <li key={day.label} className="flex justify-between gap-4 border-b border-[#e7f3f1] py-1.5">
                <span className="text-muted-foreground">{day.label}</span>
                <span className="font-medium text-foreground">{day.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dceeed] bg-[#F3FAF9] shadow-sm">
          <iframe
            title="Clinic map"
            src={CLINIC.address.mapsEmbedUrl}
            className="h-full min-h-[22rem] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
