"use client";

import { useEffect, useRef, useState } from "react";

export type GeocodingResult = {
  id: string;
  label: string;
  placeName: string;
  latitude: number;
  longitude: number;
  marina?: string;
  city?: string;
  region?: string;
  country?: string;
};

type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  context?: { id: string; text: string; short_code?: string }[];
};

type MapboxGeocodeResponse = {
  features: MapboxFeature[];
};

function parseFeature(feature: MapboxFeature): GeocodingResult {
  const ctx = feature.context ?? [];
  const byType = (prefix: string) =>
    ctx.find((c) => c.id.startsWith(prefix))?.text ?? undefined;

  return {
    id: feature.id,
    label: feature.text,
    placeName: feature.place_name,
    longitude: feature.center[0],
    latitude: feature.center[1],
    marina: feature.text,
    city: byType("place") ?? byType("locality"),
    region: byType("region"),
    country: byType("country"),
  };
}

export async function reverseGeocode(
  token: string,
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "tr");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as MapboxGeocodeResponse;
  const feature = data.features[0];
  return feature ? parseFeature(feature) : null;
}

export function useGeocodingSearch(token: string | undefined, query: string, debounceMs = 300) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!token) {
      setResults([]);
      setError(null);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const current = ++requestId.current;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`
        );
        url.searchParams.set("access_token", token);
        url.searchParams.set("autocomplete", "true");
        url.searchParams.set("limit", "5");
        url.searchParams.set("language", "tr");
        url.searchParams.set("types", "poi,address,place,locality,neighborhood");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Geocoding failed");
        const data = (await res.json()) as MapboxGeocodeResponse;
        if (current !== requestId.current) return;
        setResults(data.features.map(parseFeature));
      } catch {
        if (current !== requestId.current) return;
        setResults([]);
        setError("Arama yapılamadı");
      } finally {
        if (current === requestId.current) setLoading(false);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [token, query, debounceMs]);

  return { results, loading, error };
}
