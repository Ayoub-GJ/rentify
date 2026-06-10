const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Agadir':      { lat: 30.4278, lng: -9.5981 },
  'Casablanca':  { lat: 33.5731, lng: -7.5898 },
  'Rabat':       { lat: 34.0209, lng: -6.8416 },
  'Marrakech':   { lat: 31.6295, lng: -7.9811 },
  'Tanger':      { lat: 35.7595, lng: -5.8340 },
  'Fès':         { lat: 34.0331, lng: -5.0003 },
  'Meknès':      { lat: 33.8935, lng: -5.5547 },
  'Oujda':       { lat: 34.6814, lng: -1.9086 },
  'Kenitra':     { lat: 34.2610, lng: -6.5802 },
  'Tétouan':     { lat: 35.5785, lng: -5.3684 },
};

export const CITY_NAMES: string[] = Object.keys(CITY_COORDS);

export function getCityCoords(ville: string): { lat: number; lng: number } | null {
  if (CITY_COORDS[ville]) return CITY_COORDS[ville];
  const normalized = ville.trim().toLowerCase();
  const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === normalized);
  return key ? CITY_COORDS[key] : null;
}
