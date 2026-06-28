"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapMouseEvent, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  faAnchor,
  faLocationCrosshairs,
  faSatellite,
  faMapLocationDot,
  FontAwesomeIcon,
} from "../icons";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Field, Input } from "./form";
import { Spinner } from "./feedback";
import { reverseGeocode, useGeocodingSearch, type GeocodingResult } from "../hooks/use-geocoding-search";

export type LocationPickerValue = {
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  marina?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
};

export type LocationPickerProps = {
  mapboxToken?: string;
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
  className?: string;
};

const DEFAULT_CENTER = { latitude: 38.32, longitude: 26.3 };
const DEFAULT_ZOOM = 6;
const SEARCH_ZOOM = 14.5;

const STREETS_STYLE = "mapbox://styles/mapbox/outdoors-v12";
const SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

function formatCoord(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(5);
}

function ManualCoordinateFallback({
  value,
  onChange,
}: {
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Enlem (latitude)">
        <Input
          type="number"
          step="any"
          placeholder="38.322"
          value={value.latitude ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              latitude: e.target.value === "" ? null : Number.parseFloat(e.target.value),
            })
          }
        />
      </Field>
      <Field label="Boylam (longitude)">
        <Input
          type="number"
          step="any"
          placeholder="26.305"
          value={value.longitude ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              longitude: e.target.value === "" ? null : Number.parseFloat(e.target.value),
            })
          }
        />
      </Field>
    </div>
  );
}

export function LocationPicker({ mapboxToken, value, onChange, className }: LocationPickerProps) {
  const mapRef = useRef<MapRef>(null);
  const [query, setQuery] = useState(value.address ?? "");
  const [open, setOpen] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [reverseBusy, setReverseBusy] = useState(false);
  const { results, loading, error } = useGeocodingSearch(mapboxToken, query);

  const hasPin =
    value.latitude != null &&
    !Number.isNaN(value.latitude) &&
    value.longitude != null &&
    !Number.isNaN(value.longitude);

  const initialView = useMemo(
    () => ({
      longitude: value.longitude ?? DEFAULT_CENTER.longitude,
      latitude: value.latitude ?? DEFAULT_CENTER.latitude,
      zoom: hasPin ? SEARCH_ZOOM : DEFAULT_ZOOM,
    }),
    [hasPin, value.latitude, value.longitude]
  );

  const applyGeocode = useCallback(
    (result: GeocodingResult, zoom = SEARCH_ZOOM) => {
      onChange({
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.placeName,
        marina: result.marina ?? result.label,
        city: result.city ?? value.city,
        region: result.region ?? value.region,
        country: result.country ?? value.country,
      });
      mapRef.current?.flyTo({
        center: [result.longitude, result.latitude],
        zoom,
        duration: 1200,
      });
      setQuery(result.placeName);
      setOpen(false);
    },
    [onChange, value.city, value.country, value.region]
  );

  const updatePin = useCallback(
    async (latitude: number, longitude: number) => {
      onChange({ ...value, latitude, longitude });
      if (!mapboxToken) return;
      setReverseBusy(true);
      try {
        const result = await reverseGeocode(mapboxToken, latitude, longitude);
        if (result) {
          onChange({
            latitude,
            longitude,
            address: result.placeName,
            marina: result.marina ?? result.label,
            city: result.city ?? value.city,
            region: result.region ?? value.region,
            country: result.country ?? value.country,
          });
          setQuery(result.placeName);
        }
      } finally {
        setReverseBusy(false);
      }
    },
    [mapboxToken, onChange, value]
  );

  const onMapClick = useCallback(
    (event: MapMouseEvent) => {
      void updatePin(event.lngLat.lat, event.lngLat.lng);
    },
    [updatePin]
  );

  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      void updatePin(pos.coords.latitude, pos.coords.longitude);
    });
  }, [updatePin]);

  if (!mapboxToken) {
    return (
      <div className={cn("space-y-3 rounded-card border border-warning-200 bg-warning-50 p-4", className)}>
        <p className="text-body-sm text-warning-800">
          Harita şu an yüklenemiyor. Lütfen enlem/boylamı elle girin veya Mapbox token ekleyin.
        </p>
        <ManualCoordinateFallback value={value} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Field label="Marina, liman veya şehir ara">
          <Input
            value={query}
            placeholder="Marina, liman veya şehir ara…"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </Field>
        {open && query.trim().length >= 2 ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-body-sm text-gray-500">
                <Spinner className="h-4 w-4" /> Aranıyor…
              </div>
            ) : null}
            {!loading && results.length === 0 ? (
              <p className="px-3 py-2 text-body-sm text-gray-500">
                Sonuç bulunamadı — haritadan manuel işaretleyebilirsiniz.
              </p>
            ) : null}
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-body-sm text-gray-800 hover:bg-gray-50"
                onClick={() => applyGeocode(item)}
              >
                {item.placeName}
              </button>
            ))}
            {error ? <p className="px-3 py-2 text-caption text-danger-600">{error}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-card border border-gray-200">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={initialView}
          mapStyle={satellite ? SATELLITE_STYLE : STREETS_STYLE}
          style={{ width: "100%", height: 420 }}
          onClick={onMapClick}
          reuseMaps
        >
          <NavigationControl position="top-right" showCompass={false} />
          {hasPin ? (
            <Marker
              longitude={value.longitude!}
              latitude={value.latitude!}
              anchor="bottom"
              draggable
              onDragEnd={(e) => void updatePin(e.lngLat.lat, e.lngLat.lng)}
            >
              <div className="flex h-10 w-10 -translate-y-1 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg ring-4 ring-white">
                <FontAwesomeIcon icon={faAnchor} className="text-[18px]" />
              </div>
            </Marker>
          ) : null}
        </Map>

        <div className="absolute left-3 top-3 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-white/95"
            onClick={() => setSatellite((v) => !v)}
          >
            <FontAwesomeIcon icon={satellite ? faMapLocationDot : faSatellite} className="mr-1" />
            {satellite ? "Harita" : "Uydu"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-white/95"
            onClick={goToMyLocation}
          >
            <FontAwesomeIcon icon={faLocationCrosshairs} className="mr-1" />
            Konumum
          </Button>
        </div>
      </div>

      {!hasPin ? (
        <p className="text-body-sm text-gray-600">
          Lütfen teknenizin bulunduğu veya teslim noktasını haritada işaretleyin. Arama yapabilir,
          haritaya tıklayabilir veya iğneyi sürükleyebilirsiniz.
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-body-sm text-gray-700">
          <div className="font-medium text-ink">
            Seçilen konum: {formatCoord(value.latitude)}, {formatCoord(value.longitude)}
          </div>
          {value.address ? <div className="mt-1 text-gray-600">{value.address}</div> : null}
          {reverseBusy ? (
            <div className="mt-1 text-caption text-gray-500">Adres güncelleniyor…</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
