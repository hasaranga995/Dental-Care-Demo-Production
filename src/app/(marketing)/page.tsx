import { Hero } from "@/components/home/hero";
import { QuickBookingWidget } from "@/components/home/quick-booking-widget";
import { ServicesTicker } from "@/components/home/services-ticker";
import { CareJourney } from "@/components/home/care-journey";
import { ServicesSummary } from "@/components/home/services-summary";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { DoctorShowcase } from "@/components/home/doctor-showcase";
import { Reviews } from "@/components/home/reviews";
import { HomeVisitUs } from "@/components/home/home-visit-us";
import { getAllServices } from "@/lib/data/services";
import { getAvailableDoctors } from "@/lib/data/doctors";
import { getActiveHeroVideo } from "@/lib/data/hero-video";
import { getCategoryImageMap } from "@/lib/data/category-images";
import { getDemoPlan } from "@/lib/demo-plan-server";
import { getPlanFeatures } from "@/lib/demo-plan";

export default async function HomePage() {
  const [services, doctors, heroVideo, categoryImages, plan] = await Promise.all([
    getAllServices(),
    getAvailableDoctors(),
    getActiveHeroVideo(),
    getCategoryImageMap(),
    getDemoPlan(),
  ]);
  const features = getPlanFeatures(plan);

  return (
    <>
      <Hero video={heroVideo} />

      {features.booking ? (
        <div className="page-container relative z-20">
          <QuickBookingWidget services={services} />
        </div>
      ) : null}

      <ServicesTicker className="mt-12 sm:mt-16" />

      <ServicesSummary services={services} categoryImages={categoryImages} />

      <WhyChooseUs />

      <CareJourney />
      <DoctorShowcase doctors={doctors} />
      <Reviews />
      {plan === "presence" ? <HomeVisitUs /> : null}
    </>
  );
}
