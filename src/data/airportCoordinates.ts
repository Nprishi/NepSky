export interface AirportCoordinate {
  code: string;
  name?: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export type AirportCoordinateMap = Record<
  string,
  {
    latitude: number;
    longitude: number;
    name?: string;
    city?: string;
    country?: string;
  }
>;

/**
 * Extract airport code from strings like:
 * "Kathmandu (KTM)" => "KTM"
 * "Dubai (DXB)" => "DXB"
 */
export const extractAirportCode = (location: string): string => {
  if (!location) return '';

  const match = location.match(/\(([^)]+)\)/);
  if (match?.[1]) {
    return match[1].trim().toUpperCase();
  }

  return location.trim().toUpperCase();
};

/**
 * Convert airport rows from database into a fast lookup object:
 * {
 *   KTM: { latitude: 27.69, longitude: 85.35, ... },
 *   DXB: { latitude: 25.25, longitude: 55.36, ... }
 * }
 */
export const buildAirportCoordinateMap = (
  airports: AirportCoordinate[]
): AirportCoordinateMap => {
  return airports.reduce<AirportCoordinateMap>((acc, airport) => {
    const code = airport.code?.trim().toUpperCase();

    if (!code) return acc;

    acc[code] = {
      latitude: Number(airport.latitude),
      longitude: Number(airport.longitude),
      name: airport.name,
      city: airport.city,
      country: airport.country,
    };

    return acc;
  }, {});
};