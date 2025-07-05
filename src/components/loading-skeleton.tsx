import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function LoadingSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <Skeleton className="h-8 w-1/2 rounded-md" />
        <Skeleton className="h-4 w-1/4 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3 rounded-md" />
          <Skeleton className="h-5 w-full rounded-md" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
