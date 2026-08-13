import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBannersLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
