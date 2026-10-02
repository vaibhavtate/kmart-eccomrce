import { supabase } from '../lib/supabase/client';
import { DbStore } from '../types/database';

export function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const earthRadiusKm = 6371;

  const lat1 = (latitude1 * Math.PI) / 180;
  const lat2 = (latitude2 * Math.PI) / 180;

  const deltaLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const deltaLongitude = ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export const DEFAULT_STORES: DbStore[] = [
  {
    id: '458cbfde-68fd-4e71-86c7-a12a4cecad4d',
    name: 'K MART - Baramati (Kasba / Nira Rd)',
    address: 'Baramati - Nira Rd, Yashwant Nagar, Kasba, Baramati, Maharashtra 413102',
    latitude: 18.1433,
    longitude: 74.5658,
    service_radius_km: 5,
    gofrugal_account_id: 'STORE1',
    active: true,
  },
  {
    id: 'f524383f-c351-41a3-a98d-6fb139e832a7',
    name: 'K MART - Store 2 (Camp / East)',
    address: 'Station / Camp Road, Pune, Maharashtra 411001',
    latitude: 18.5300,
    longitude: 73.8700,
    service_radius_km: 5,
    gofrugal_account_id: 'STORE2',
    active: true,
  },
];

export function findNearestStore(
  stores: DbStore[],
  latitude: number,
  longitude: number
): { store: DbStore; distanceKm: number; isWithinRadius: boolean } | null {
  const activeStores = stores.length > 0 ? stores : DEFAULT_STORES;
  if (!activeStores || activeStores.length === 0) return null;

  let nearestStore = activeStores[0];
  let minDistance = calculateDistanceKm(
    nearestStore.latitude,
    nearestStore.longitude,
    latitude,
    longitude
  );

  for (let i = 1; i < activeStores.length; i++) {
    const s = activeStores[i];
    const dist = calculateDistanceKm(s.latitude, s.longitude, latitude, longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestStore = s;
    }
  }

  const roundedDistance = Number(minDistance.toFixed(2));
  const maxRadius = nearestStore.service_radius_km || 5;

  return {
    store: nearestStore,
    distanceKm: roundedDistance,
    isWithinRadius: roundedDistance <= maxRadius,
  };
}

export const storeService = {
  async getStores(client = supabase): Promise<DbStore[]> {
    try {
      const { data, error } = await client
        .from('stores')
        .select('*')
        .eq('active', true);

      if (error || !data || data.length === 0) {
        return DEFAULT_STORES;
      }

      // Ensure every store has a 5km delivery radius if not set
      return data.map((store) => ({
        ...store,
        service_radius_km: store.service_radius_km || 5,
      }));
    } catch {
      return DEFAULT_STORES;
    }
  },
};
