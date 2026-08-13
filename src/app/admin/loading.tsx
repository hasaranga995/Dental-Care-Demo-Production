import { PageLoader } from "@/components/loading/page-loader";

export default function AdminLoading() {
  return <PageLoader label="Loading admin panel…" fullScreen={false} className="min-h-[24rem]" />;
}
