import { PageLoader } from "@/components/loading/page-loader";

export default function DoctorPortalLoading() {
  return <PageLoader label="Loading doctor portal…" fullScreen={false} className="min-h-[24rem]" />;
}
