"use client";

import { useState } from "react";
import { Banner, Carousel, Skeleton, faLightbulb } from "@getyourboat/ui";
import type { AnnouncementDTO } from "@getyourboat/shared";
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
      slides={data.map((a: AnnouncementDTO) => (
        <Banner
          key={a.id}
          icon={faLightbulb}
          title={a.title}
          description={a.description}
          onDismiss={() => setDismissed(true)}
        />
      ))}
    />
  );
}
