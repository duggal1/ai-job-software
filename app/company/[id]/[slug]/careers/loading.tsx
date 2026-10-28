import { CareersSkeleton } from "@/components/careers-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <CareersSkeleton />
    </div>
  );
}
