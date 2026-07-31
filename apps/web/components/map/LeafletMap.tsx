'use client'

import { useEffect, useRef, useState } from 'react'

export interface MapLocation {
  name: string
  lat: number
  lng: number
  count: number
  unit?: string
  href?: string
}

const RENTAL_LOCATIONS: MapLocation[] = [
  { name: 'Bodrum',   lat: 37.034, lng: 27.430, count: 128, unit: 'tekne', href: '/listing' },
  { name: 'Marmaris', lat: 36.855, lng: 28.269, count: 94,  unit: 'tekne', href: '/listing' },
  { name: 'Göcek',    lat: 36.747, lng: 28.928, count: 67,  unit: 'tekne', href: '/listing' },
  { name: 'Çeşme',    lat: 38.322, lng: 26.304, count: 54,  unit: 'tekne', href: '/listing' },
  { name: 'Kaş',      lat: 36.200, lng: 29.635, count: 48,  unit: 'tekne', href: '/listing' },
  { name: 'Fethiye',  lat: 36.656, lng: 29.117, count: 76,  unit: 'tekne', href: '/listing' },
  { name: 'Kuşadası', lat: 37.856, lng: 27.260, count: 41,  unit: 'tekne', href: '/listing' },
  { name: 'Datça',    lat: 36.726, lng: 27.689, count: 33,  unit: 'tekne', href: '/listing' },
  { name: 'Antalya',  lat: 36.897, lng: 30.713, count: 38,  unit: 'tekne', href: '/listing' },
  { name: 'İzmir',    lat: 38.419, lng: 27.129, count: 61,  unit: 'tekne', href: '/listing' },
]

const EXPERIENCE_LOCATIONS: MapLocation[] = [
  { name: 'Bodrum Koyları', lat: 37.060, lng: 27.460, count: 42, unit: 'deneyim', href: '/deneyimler' },
  { name: 'Kaş Cennet Koyu', lat: 36.195, lng: 29.640, count: 28, unit: 'deneyim', href: '/deneyimler' },
  { name: 'Fethiye Ölüdeniz', lat: 36.547, lng: 29.115, count: 35, unit: 'deneyim', href: '/deneyimler' },
  { name: 'İzmir Marina',  lat: 38.430, lng: 27.140, count: 31, unit: 'deneyim', href: '/deneyimler' },
  { name: 'Antalya Sahil', lat: 36.882, lng: 30.700, count: 19, unit: 'deneyim', href: '/deneyimler' },
  { name: 'Marmaris Koyu', lat: 36.840, lng: 28.260, count: 24, unit: 'deneyim', href: '/deneyimler' },
]

interface Props {
  mode?: 'rental' | 'experience'
  onLocationClick?: (name: string) => void
  /** Nav ile aynı logo — işaretçinin üzerinde gösterilir */
  logoUrl?: string | null
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const LEAFLET_CSS_ID = 'leaflet-css-seahub'
const LEAFLET_CSS_HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'

/** Günlük kullanım — sade, açık sokak haritası (topografya / relief yok) */
const MAP_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
} as const

function ensureLeafletCssLoaded(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (document.getElementById(LEAFLET_CSS_ID)) return Promise.resolve()
  return new Promise(resolve => {
    const cssLink = document.createElement('link')
    cssLink.id = LEAFLET_CSS_ID
    cssLink.rel = 'stylesheet'
    cssLink.href = LEAFLET_CSS_HREF
    cssLink.crossOrigin = 'anonymous'
    cssLink.onload = () => resolve()
    cssLink.onerror = () => resolve()
    document.head.appendChild(cssLink)
  })
}

export default function LeafletMap({ mode = 'rental', onLocationClick, logoUrl = null }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<import('leaflet').Map | null>(null)
  const markersRef   = useRef<import('leaflet').Marker[]>([])
  const [ready, setReady]   = useState(false)
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null)

  // Init map once (Strict Mode: iptal bayrağı + konteyner boyutu; 0 yükseklikte karo yok)
  useEffect(() => {
    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    const extraTimers: ReturnType<typeof setTimeout>[] = []

    if (!containerRef.current) return

    void ensureLeafletCssLoaded().then(() => import('leaflet')).then(L => {
      if (cancelled || !containerRef.current) return

      const el = containerRef.current as HTMLElement & { _leaflet_id?: number }
      if (el._leaflet_id != null) {
        mapRef.current?.remove()
        mapRef.current = null
      }
      if (mapRef.current) return

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(el, {
        center: [38.2, 21.5],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
        minZoom: 4,
        maxBounds: [
          [28, -8],
          [48, 42],
        ],
        maxBoundsViscosity: 0.85,
      })

      L.tileLayer(MAP_TILE.url, {
        attribution: MAP_TILE.attribution,
        subdomains: MAP_TILE.subdomains,
        maxZoom: MAP_TILE.maxZoom,
      }).addTo(map)

      /* İlk açılış: Antalya ile İtalya güneyi arası Doğu Akdeniz */
      const medBounds = L.latLngBounds([34.0, 11.2], [42.8, 32.2])
      map.fitBounds(medBounds, { padding: [28, 28], maxZoom: 6 })

      mapRef.current = map
      setLeaflet(L)
      setReady(true)

      const invalidate = () => {
        map.invalidateSize({ animate: false })
      }
      requestAnimationFrame(() => {
        invalidate()
        requestAnimationFrame(invalidate)
      })
      extraTimers.push(setTimeout(invalidate, 120))
      extraTimers.push(setTimeout(invalidate, 400))

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => invalidate())
        resizeObserver.observe(el)
      }
    })

    return () => {
      cancelled = true
      extraTimers.forEach(t => clearTimeout(t))
      resizeObserver?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Re-draw markers when mode changes
  useEffect(() => {
    if (!mapRef.current || !leaflet || !ready) return
    const L = leaflet
    const map = mapRef.current

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const locs = mode === 'rental' ? RENTAL_LOCATIONS : EXPERIENCE_LOCATIONS
    const linkLabel = mode === 'rental' ? 'Tekneleri Gör →' : 'Deneyimleri Gör →'

    const logoSrc = logoUrl?.trim()
      ? escapeHtml(logoUrl.trim())
      : ''

    locs.forEach(loc => {
      const logoBlock = logoSrc
        ? `<img class="map-marker-logo-img" src="${logoSrc}" alt="" decoding="async" />`
        : `<span class="map-marker-logo-fallback" aria-hidden="true">S</span>`

      const pinHtml = `
        <div class="map-marker-root" title="${escapeHtml(loc.name)} — ${loc.count} ${escapeHtml(loc.unit ?? '')} mevcut">
          <div class="map-marker-pin-wrap">
            <div class="map-marker-pin-shape"></div>
            <div class="map-marker-logo">${logoBlock}</div>
          </div>
        </div>`

      /* Sadece pin + logo; iconAnchor alt orta = koordinat */
      const W = 44
      const H = 44
      const icon = L.divIcon({
        html: pinHtml,
        className: 'map-marker-divicon',
        iconSize: [W, H],
        iconAnchor: [W / 2, H],
        popupAnchor: [0, -H],
      })

      const marker = L.marker([loc.lat, loc.lng], { icon })

      marker.bindPopup(`
        <div class="map-popup">
          <div class="map-popup-name">${loc.name}</div>
          <div class="map-popup-count">${loc.count} ${loc.unit ?? ''} mevcut</div>
          <a href="${loc.href ?? '/listing'}" class="map-popup-link">${linkLabel}</a>
        </div>`, {
        closeButton: false,
        className: 'seahub-popup',
      })

      marker.on('click', () => onLocationClick?.(loc.name))
      marker.addTo(map)
      markersRef.current.push(marker)
    })

    requestAnimationFrame(() => {
      map.invalidateSize()
    })
  }, [mode, ready, leaflet, onLocationClick, logoUrl])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        /* %100 yükseklik üstten gelmezse 0px kalır; Leaflet için sabit min yükseklik şart */
        minHeight: 480,
        height: 480,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {!ready && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#f0f4f8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            zIndex: 5,
          }}
        >
          <div style={{ textAlign: 'center', color: '#6a6a6a' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Harita yükleniyor…</div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: 480, borderRadius: 20 }}
      />
    </div>
  )
}
