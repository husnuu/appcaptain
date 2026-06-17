"use client";

import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { Banner, Carousel, Skeleton } from "@getyourboat/ui";
import { useAnnouncements } from "../../lib/api/dashboard";

export function AnnouncementCarousel() {
  const { data, isLoading } = useAnnouncements();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (isLoading) return <Skeleton className="h-20 w-full rounded-card" />;
  if (!data || data.length === 0) return null;

  return (
    <Carousel
      className="mb-6"
      slides={data.map((a) => (
        <Banner
          key={a.id}
          icon={Lightbulb}
          title={a.title}
          description={a.description}
          onDismiss={() => setDismissed(true)}
        />
      ))}
    />
  );
}
