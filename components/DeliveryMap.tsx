"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  Circle,
  Polyline,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  Navigation,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Layers,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { reverseGeocode, PUNE_POPULAR_AREAS } from "../lib/geolocation";

// 2 Pune K MART store hubs (5km delivery radius each)
export const KMART_STORES = [
  {
    id: "458cbfde-68fd-4e71-86c7-a12a4cecad4d",
    name: "K MART • Baramati",
    address: "Baramati - Nira Rd, Yashwant Nagar, Kasba, Baramati, Maharashtra 413102",
    lat: 18.1433,
    lng: 74.5658,
    serviceRadiusKm: 5.0,
  },
  {
    id: "f524383f-c351-41a3-a98d-6fb139e832a7",
    name: "Store 2 • Camp / East",
    address: "Station / Camp Road, Pune, Maharashtra 411001",
    lat: 18.5300,
    lng: 73.8700,
    serviceRadiusKm: 5.0,
  },
];

// Calculate Haversine distance in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function getNearestKMartStore(lat: number, lng: number) {
  let nearest = KMART_STORES[0];
  let minDistance = calculateDistanceKm(nearest.lat, nearest.lng, lat, lng);

  for (let i = 1; i < KMART_STORES.length; i++) {
    const s = KMART_STORES[i];
    const dist = calculateDistanceKm(s.lat, s.lng, lat, lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = s;
    }
  }

  return {
    store: nearest,
    distanceKm: minDistance,
    isDeliverable: minDistance <= nearest.serviceRadiusKm,
  };
}

export interface DeliveryLocationData {
  lat: number;
  lng: number;
  area: string;
  pincode: string;
  city: string;
  distanceKm: number;
  isDeliverable: boolean;
  storeName?: string;
  storeId?: string;
}

export interface DeliveryMapProps {
  initialLat?: number;
  initialLng?: number;
  height?: string;
  showStorePin?: boolean;
  showRadius?: boolean;
  showRoute?: boolean;
  showAreaChips?: boolean;
  interactive?: boolean;
  onLocationSelect?: (location: DeliveryLocationData) => void;
  className?: string;
}

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

// Inner Controller component that has access to useMap()
const MapController: React.FC<{
  currentLat: number;
  currentLng: number;
  onRegisterControls: (controls: MapControlsProps) => void;
}> = ({ currentLat, currentLng, onRegisterControls }) => {
  const map = useMap();

  // Automatically pan & zoom map to coordinates whenever currentLat or currentLng changes
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: currentLat, lng: currentLng });
    map.setZoom(16);
  }, [map, currentLat, currentLng]);

  useEffect(() => {
    if (!map) return;

    onRegisterControls({
      onZoomIn: () => {
        const z = map.getZoom() || 14;
        map.setZoom(z + 1);
      },
      onZoomOut: () => {
        const z = map.getZoom() || 14;
        map.setZoom(Math.max(z - 1, 1));
      },
      onResetView: () => {
        if (typeof google === "undefined" || !google.maps) return;
        const bounds = new google.maps.LatLngBounds();
        KMART_STORES.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
        bounds.extend({ lat: currentLat, lng: currentLng });
        map.fitBounds(bounds, 45);
      },
      onLocateMe: () => {
        map.panTo({ lat: currentLat, lng: currentLng });
        map.setZoom(16);
      },
      isLocating: false,
    });
  }, [map, currentLat, currentLng, onRegisterControls]);

  return null;
};

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  initialLat = 18.5530,
  initialLng = 73.7920,
  height = "260px",
  showStorePin = true,
  showRadius = true,
  showRoute = true,
  showAreaChips = true,
  interactive = true,
  onLocationSelect,
  className = "",
}) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      (typeof window !== "undefined"
        ? localStorage.getItem("gmp_api_key") || ""
        : "")
    );
  });

  const initialNearest = getNearestKMartStore(initialLat, initialLng);
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [nearestStore, setNearestStore] = useState(initialNearest.store);
  const [distanceKm, setDistanceKm] = useState(initialNearest.distanceKm);
  const [isDeliverable, setIsDeliverable] = useState(initialNearest.isDeliverable);
  const [detectedArea, setDetectedArea] = useState("Pune City");
  const [detectedPincode, setDetectedPincode] = useState("411001");
  const [isLocating, setIsLocating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite">("standard");

  const [apiFailed, setApiFailed] = useState(false);
  const mapControlsRef = useRef<MapControlsProps | null>(null);

  // Sync internal state when initialLat or initialLng props change (e.g. GPS geolocation detected in parent)
  useEffect(() => {
    if (
      typeof initialLat === "number" &&
      typeof initialLng === "number" &&
      (Math.abs(initialLat - currentLat) > 0.0001 || Math.abs(initialLng - currentLng) > 0.0001)
    ) {
      setCurrentLat(initialLat);
      setCurrentLng(initialLng);
      const nearestInfo = getNearestKMartStore(initialLat, initialLng);
      setNearestStore(nearestInfo.store);
      setDistanceKm(nearestInfo.distanceKm);
      setIsDeliverable(nearestInfo.isDeliverable);

      reverseGeocode(initialLat, initialLng)
        .then((rev) => {
          if (rev) {
            setDetectedArea(rev.line1 || rev.city || "Detected Location");
            setDetectedPincode(rev.pincode || "411001");
          }
        })
        .catch(() => {});
    }
  }, [initialLat, initialLng]);

  // Catch Google Maps JS Auth Failure gracefully and fallback to Google Maps Embed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps JS API auth error - activating Google Maps Embed fallback");
      setApiFailed(true);
      if (typeof prevAuthFailure === "function") prevAuthFailure();
    };
    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Handle location update callback and reverse geocode
  const triggerLocationChange = useCallback(
    async (lat: number, lng: number, manualArea?: string, manualPin?: string) => {
      const nearestInfo = getNearestKMartStore(lat, lng);
      setNearestStore(nearestInfo.store);
      setDistanceKm(nearestInfo.distanceKm);
      setIsDeliverable(nearestInfo.isDeliverable);
      setCurrentLat(lat);
      setCurrentLng(lng);

      let area = manualArea || "Selected Map Location";
      let pincode = manualPin || "411001";
      let city = "Pune";

      // If Google Maps Geocoder is available in browser, use Google's Geocoder
      if (
        !manualArea &&
        typeof window !== "undefined" &&
        (window as any).google?.maps?.Geocoder
      ) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder();
          const response = await new Promise<any>((resolve) => {
            geocoder.geocode({ location: { lat, lng } }, (res: any, status: any) => {
              if (status === "OK" && res && res[0]) {
                resolve(res[0]);
              } else {
                resolve(null);
              }
            });
          });

          if (response) {
            let foundSublocality = "";
            let foundCity = "";
            let foundPin = "";

            response.address_components?.forEach((comp: any) => {
              if (
                comp.types.includes("sublocality") ||
                comp.types.includes("sublocality_level_1") ||
                comp.types.includes("neighborhood")
              ) {
                foundSublocality = comp.long_name;
              }
              if (comp.types.includes("locality")) {
                foundCity = comp.long_name;
              }
              if (comp.types.includes("postal_code")) {
                foundPin = comp.long_name;
              }
            });

            if (foundSublocality) area = foundSublocality;
            else if (response.formatted_address) {
              area = response.formatted_address.split(",")[0];
            }
            if (foundCity) city = foundCity;
            if (foundPin) pincode = foundPin;
          }
        } catch {
          // fallback to local geocoder
        }
      }

      // If area still generic, run fallback reverseGeocode
      if (area === "Selected Map Location") {
        try {
          const rev = await reverseGeocode(lat, lng);
          area = rev.line1 || rev.city || "Selected Location";
          pincode = rev.pincode || pincode;
          city = rev.city || city;
        } catch {
          // ignore
        }
      }

      setDetectedArea(area);
      setDetectedPincode(pincode);

      if (onLocationSelect) {
        onLocationSelect({
          lat,
          lng,
          area,
          pincode,
          city,
          distanceKm: nearestInfo.distanceKm,
          isDeliverable: nearestInfo.isDeliverable,
          storeName: nearestInfo.store.name,
          storeId: nearestInfo.store.id,
        });
      }
    },
    [onLocationSelect]
  );

  const handleRegisterControls = useCallback((controls: MapControlsProps) => {
    mapControlsRef.current = controls;
  }, []);

  // Use Browser GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        triggerLocationChange(latitude, longitude);
        if (mapControlsRef.current) {
          mapControlsRef.current.onLocateMe();
        }
      },
      () => {
        setIsLocating(false);
        triggerLocationChange(
          KMART_STORES[0].lat,
          KMART_STORES[0].lng,
          KMART_STORES[0].name,
          "411001"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200 overflow-hidden bg-slate-50 flex flex-col shadow-xs transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-[9999] h-auto shadow-2xl bg-white" : ""
      } ${className}`}
    >
      {/* Top Map Action Bar */}
      <div className="px-3.5 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-gray-800">
          <MapPin className="w-4 h-4 text-[#E11A22]" />
          <span>Google Maps • Delivery Zone</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Map style toggle */}
          <button
            type="button"
            onClick={() =>
              setMapStyle(mapStyle === "standard" ? "satellite" : "standard")
            }
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 font-semibold text-[11px] flex items-center gap-1 border border-gray-200 transition-colors cursor-pointer"
            title="Toggle Satellite / Street Map"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline capitalize">{mapStyle}</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={() => mapControlsRef.current?.onResetView()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Map" : "Expand Map"}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Map Canvas with Google Maps Overlays */}
      <div
        className="relative w-full overflow-hidden bg-slate-100"
        style={{ height: isExpanded ? "calc(100vh - 170px)" : height }}
      >
        {apiKey && !apiFailed ? (
          <APIProvider
            apiKey={apiKey}
            region="IN"
            language="en"
            libraries={["places", "geometry", "marker"]}
            onError={() => {
              console.warn("APIProvider error - switching to Google Maps live embed");
              setApiFailed(true);
            }}
          >
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
              defaultCenter={{ lat: currentLat, lng: currentLng }}
              defaultZoom={15}
              mapTypeId={mapStyle === "satellite" ? "hybrid" : "roadmap"}
              gestureHandling="greedy"
              disableDefaultUI={true}
              style={{ width: "100%", height: "100%" }}
              onClick={(e) => {
                if (!interactive) return;
                const latLng = e.detail.latLng;
                if (latLng) {
                  triggerLocationChange(latLng.lat, latLng.lng);
                }
              }}
            >
              {/* Controller for external buttons & auto-pan on GPS detection */}
              <MapController
                currentLat={currentLat}
                currentLng={currentLng}
                onRegisterControls={handleRegisterControls}
              />

              {/* K MART 2 Store Hub Markers */}
              {showStorePin &&
                KMART_STORES.map((s) => (
                  <AdvancedMarker
                    key={s.id}
                    position={{ lat: s.lat, lng: s.lng }}
                    title={s.name}
                  >
                    <div className="flex flex-col items-center pointer-events-auto cursor-pointer">
                      <div
                        className={`text-white px-2.5 py-1 rounded-full font-black text-[11px] shadow-lg border-2 border-white flex items-center gap-1.5 whitespace-nowrap ${
                          nearestStore.id === s.id ? "bg-[#E11A22]" : "bg-[#0A2540]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span>{s.name} (5km)</span>
                      </div>
                      <div
                        className={`w-2 h-2 rotate-45 -mt-1 border-r border-b border-white ${
                          nearestStore.id === s.id ? "bg-[#E11A22]" : "bg-[#0A2540]"
                        }`}
                      />
                    </div>
                  </AdvancedMarker>
                ))}

              {/* Delivery Destination User Pin */}
              <AdvancedMarker
                position={{ lat: currentLat, lng: currentLng }}
                title="Delivery Destination"
                draggable={interactive}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    triggerLocationChange(e.latLng.lat(), e.latLng.lng());
                  }
                }}
              >
                <Pin
                  background="#E11A22"
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={1.15}
                />
              </AdvancedMarker>

              {/* 5km Delivery Service Radii for BOTH stores */}
              {showRadius &&
                KMART_STORES.map((s) => (
                  <Circle
                    key={`radius-${s.id}`}
                    center={{ lat: s.lat, lng: s.lng }}
                    radius={s.serviceRadiusKm * 1000}
                    strokeColor={nearestStore.id === s.id ? "#E11A22" : "#0A2540"}
                    strokeOpacity={0.45}
                    strokeWeight={2}
                    fillColor={nearestStore.id === s.id ? "#E11A22" : "#0A2540"}
                    fillOpacity={0.06}
                  />
                ))}

              {/* Dispatch Route Polyline from nearest store */}
              {showRoute && (
                <Polyline
                  path={[
                    { lat: nearestStore.lat, lng: nearestStore.lng },
                    { lat: currentLat, lng: currentLng },
                  ]}
                  strokeColor="#E11A22"
                  strokeOpacity={0.8}
                  strokeWeight={3}
                />
              )}
            </Map>
          </APIProvider>
        ) : (
          /* Live Google Maps Embed View (Always works, centered on detected GPS coordinates with red marker) */
          <div className="w-full h-full relative">
            <iframe
              title="Google Maps Delivery Location"
              src={`https://maps.google.com/maps?q=${currentLat},${currentLng}&z=16&output=embed`}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Top-left Overlay Pill indicating Live Detected Location on Map */}
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
              <span className="bg-white/95 backdrop-blur-xs text-[#0A2540] text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Pinned: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}</span>
              </span>
            </div>
          </div>
        )}

        {/* Floating Zoom & Locate Controls (Right side) */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="w-8 h-8 rounded-xl bg-white shadow-md border border-gray-200 flex items-center justify-center text-[#0A2540] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            title="Locate my position (GPS)"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#E11A22]" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </button>

          <a
            href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-white shadow-md border border-gray-200 flex items-center justify-center text-[#E11A22] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {apiKey && !apiFailed && (
            <>
              <button
                type="button"
                onClick={() => mapControlsRef.current?.onZoomIn()}
                className="w-8 h-8 rounded-xl bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer font-bold text-base"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => mapControlsRef.current?.onZoomOut()}
                className="w-8 h-8 rounded-xl bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer font-bold text-base"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Popular Area Quick Select Chips */}
      {showAreaChips && (
        <div className="px-3 py-1.5 bg-slate-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-gray-400 font-bold shrink-0 text-[10px] uppercase tracking-wider">Quick:</span>
          {PUNE_POPULAR_AREAS.slice(0, 6).map((area) => (
            <button
              type="button"
              key={area.area}
              onClick={() => {
                triggerLocationChange(area.latitude, area.longitude, area.area, area.pincode);
                if (mapControlsRef.current) {
                  mapControlsRef.current.onLocateMe();
                }
              }}
              className="px-2 py-0.5 rounded-md bg-white border border-gray-200 hover:border-[#E11A22] text-gray-700 hover:text-[#E11A22] font-semibold shrink-0 transition-colors cursor-pointer text-[10px]"
            >
              {area.area}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate pr-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isDeliverable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <div className="truncate">
            <span className="font-bold text-gray-800 truncate block">
              {detectedArea}, {detectedPincode}
            </span>
            <span className="text-[10px] text-gray-500">
              {isDeliverable ? `Serving Store: ${nearestStore.name}` : `Out of 5km radius (${nearestStore.name})`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              isDeliverable
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-amber-700 bg-amber-50 border-amber-200"
            }`}
          >
            {distanceKm} km away
          </span>
        </div>
      </div>
    </div>
  );
};
