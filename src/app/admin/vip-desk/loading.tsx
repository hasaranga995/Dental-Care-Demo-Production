import { Skeleton } from "@/components/ui/skeleton";

export default function AdminVipDeskLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
