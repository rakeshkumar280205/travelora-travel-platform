import { connection } from "next/server";

import { PackageCard } from "@/components/travel/package-card";
import { ErrorState } from "@/components/ui/error-state";
import { getPublishedPackages } from "@/server/services/package-service";

export async function FeaturedJourneys() {
  await connection();

  let packages;
  try {
    packages = await getPublishedPackages();
  } catch {
    return <ErrorState />;
  }

  if (packages.length === 0) {
    return (
      <ErrorState
        title="New journeys are on their way"
        message="Our next collection of considered journeys is being prepared."
      />
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {packages.slice(0, 4).map((packageRecord) => (
        <PackageCard
          key={packageRecord.id}
          slug={packageRecord.slug}
          title={packageRecord.title}
          destination={packageRecord.destination}
          durationDays={packageRecord.durationDays}
          description={packageRecord.description}
          hotelCategory={packageRecord.hotelCategory}
        />
      ))}
    </div>
  );
}
