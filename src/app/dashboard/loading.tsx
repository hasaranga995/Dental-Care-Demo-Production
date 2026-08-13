import { PageLoader } from "@/components/loading/page-loader";

export default function DashboardLoading() {
  return <PageLoader label="Loading your dashboard…" fullScreen={false} className="min-h-[24rem]" />;
}
