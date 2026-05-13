import { Flight, Booking } from '../types';

// 1. SEARCH & SORTING ALGORITHMS

// Quick Sort for flights by any numeric key (default: price)
export const quickSortFlights = (
  flights: Flight[],
  key: keyof Flight = 'price'
): Flight[] => {
  if (flights.length <= 1) return flights;

  const pivot = flights[Math.floor(flights.length / 2)];

  const left = flights.filter(
    (f) => Number(f[key]) < Number(pivot[key])
  );
  const middle = flights.filter(
    (f) => Number(f[key]) === Number(pivot[key])
  );
  const right = flights.filter(
    (f) => Number(f[key]) > Number(pivot[key])
  );

  return [
    ...quickSortFlights(left, key),
    ...middle,
    ...quickSortFlights(right, key),
  ];
};

// Binary Search for flights by exact price
export const binarySearchFlight = (
  sortedFlights: Flight[],
  targetPrice: number
): Flight | null => {
  let left = 0;
  let right = sortedFlights.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (sortedFlights[mid].price === targetPrice) {
      return sortedFlights[mid];
    }

    if (sortedFlights[mid].price < targetPrice) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return null;
};

// Merge Sort for bookings by created_at date
export const mergeSortBookings = (bookings: Booking[] | any[]): Booking[] | any[] => {
  if (bookings.length <= 1) return bookings;

  const mid = Math.floor(bookings.length / 2);
  const left = mergeSortBookings(bookings.slice(0, mid));
  const right = mergeSortBookings(bookings.slice(mid));

  return merge(left, right);
};

const merge = (left: any[], right: any[]): any[] => {
  const result: any[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (new Date(left[i].created_at) <= new Date(right[j].created_at)) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
};

// 2. RECOMMENDATION & OPTIMIZATION ALGORITHMS

// Collaborative Filtering for flight recommendations
export const recommendFlights = (
  userBookings: any[],
  allFlights: Flight[],
  limit: number = 5
): Flight[] => {
  const userDestinations = userBookings.map((b) => b.flight?.to_location || '');
  const popularDestinations = new Map<string, number>();

  userDestinations.forEach((dest) => {
    popularDestinations.set(dest, (popularDestinations.get(dest) || 0) + 1);
  });

  const recommendedFlights = allFlights.filter((flight) => {
    return (
      userDestinations.includes(flight.from) ||
      popularDestinations.has(flight.to)
    );
  });

  return quickSortFlights(recommendedFlights, 'price').slice(0, limit);
};

// Dynamic Programming: Knapsack algorithm for optimal seat selection
export const optimizeSeatSelection = (
  seats: Array<{ id: string; price: number; comfort: number }>,
  budget: number
): string[] => {
  const n = seats.length;
  const dp: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(budget + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= budget; w++) {
      if (seats[i - 1].price <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - seats[i - 1].price] + seats[i - 1].comfort
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const selectedSeats: string[] = [];
  let w = budget;

  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedSeats.push(seats[i - 1].id);
      w -= seats[i - 1].price;
    }
  }

  return selectedSeats.reverse();
};

// Greedy Algorithm: Best price-time ratio flights
export const findBestValueFlights = (flights: Flight[]): Array<Flight & { valueScore: number }> => {
  return flights
    .map((flight) => {
      const durationHours = parseDuration(flight.duration);
      const valueScore =
        durationHours > 0 ? flight.price / durationHours : flight.price;

      return { ...flight, valueScore };
    })
    .sort((a, b) => a.valueScore - b.valueScore)
    .slice(0, 10);
};

const parseDuration = (duration: string): number => {
  const hours = duration.match(/(\d+)h/);
  const minutes = duration.match(/(\d+)m/);

  return (
    (hours ? parseInt(hours[1], 10) : 0) +
    (minutes ? parseInt(minutes[1], 10) / 60 : 0)
  );
};

// Dijkstra's Algorithm for shortest flight path by price
export const findShortestPath = (
  flights: Flight[],
  start: string,
  end: string
): Flight[] => {
  const graph = new Map<string, Array<{ destination: string; flight: Flight; cost: number }>>();

  flights.forEach((flight) => {
    const from = flight.from.split('(')[0].trim();
    const to = flight.to.split('(')[0].trim();

    if (!graph.has(from)) graph.set(from, []);
    graph.get(from)!.push({
      destination: to,
      flight,
      cost: flight.price,
    });

    // Ensure destination node also exists in graph
    if (!graph.has(to)) graph.set(to, []);
  });

  const distances = new Map<string, number>();
  const previous = new Map<string, Flight | null>();
  const unvisited = new Set<string>();

  graph.forEach((_, node) => {
    distances.set(node, Infinity);
    previous.set(node, null);
    unvisited.add(node);
  });

  distances.set(start, 0);

  while (unvisited.size > 0) {
    let current: string | null = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      const distance = distances.get(node) ?? Infinity;
      if (distance < minDistance) {
        minDistance = distance;
        current = node;
      }
    }

    if (current === null) break;
    if (current === end) break;

    unvisited.delete(current);

    const neighbors = graph.get(current) || [];

    neighbors.forEach(({ destination, flight, cost }) => {
      if (unvisited.has(destination)) {
        const alt = (distances.get(current) ?? Infinity) + cost;

        if (alt < (distances.get(destination) ?? Infinity)) {
          distances.set(destination, alt);
          previous.set(destination, flight);
        }
      }
    });
  }

  const path: Flight[] = [];
  let current = end;

  while (previous.get(current)) {
    const flight = previous.get(current);
    if (flight) {
      path.unshift(flight);
      current = flight.from.split('(')[0].trim();
    }
  }

  return path;
};

// 3. LOCATION & DISTANCE ALGORITHMS

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Haversine Formula
 * Calculate straight air distance between two geographic points in kilometers.
 */
export const calculateHaversineDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const toRadians = (degree: number): number => degree * (Math.PI / 180);

  const earthRadiusKm = 6371;

  const lat1 = toRadians(point1.latitude);
  const lon1 = toRadians(point1.longitude);
  const lat2 = toRadians(point2.latitude);
  const lon2 = toRadians(point2.longitude);

  const deltaLat = lat2 - lat1;
  const deltaLon = lon2 - lon1;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;

  return Number(distance.toFixed(2));
};

/**
 * Estimate flight time from distance
 * Default average aircraft speed = 800 km/h
 */
export const estimateFlightTime = (
  distanceKm: number,
  averageSpeedKmH: number = 800
): string => {
  if (distanceKm <= 0 || averageSpeedKmH <= 0) return '0h 0m';

  const totalHours = distanceKm / averageSpeedKmH;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  return `${hours}h ${minutes}m`;
};

/**
 * Calculate flight distance directly from flight coordinates
 * Requires the flight object to include:
 * - fromLat
 * - fromLng
 * - toLat
 * - toLng
 */
export const calculateFlightDistance = (flight: any): number => {
  if (
    typeof flight.fromLat !== 'number' ||
    typeof flight.fromLng !== 'number' ||
    typeof flight.toLat !== 'number' ||
    typeof flight.toLng !== 'number'
  ) {
    return 0;
  }

  return calculateHaversineDistance(
    {
      latitude: flight.fromLat,
      longitude: flight.fromLng,
    },
    {
      latitude: flight.toLat,
      longitude: flight.toLng,
    }
  );
};

/**
 * Best value flights by price per kilometer
 * Requires coordinate fields in each flight:
 * fromLat, fromLng, toLat, toLng
 */
export const findBestValueFlightsByDistance = (
  flights: any[]
): Array<any & { distance: number; valueScore: number }> => {
  return flights
    .map((flight) => {
      const distance = calculateFlightDistance(flight);
      const valueScore = distance > 0 ? flight.price / distance : flight.price;

      return {
        ...flight,
        distance,
        valueScore: Number(valueScore.toFixed(4)),
      };
    })
    .sort((a, b) => a.valueScore - b.valueScore)
    .slice(0, 10);
};

// 4. SECURITY & ENCRYPTION ALGORITHMS

// Simple XOR-based encryption with Base64 encoding
export const encryptData = (data: string, key: string): string => {
  let encrypted = '';

  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode ^ keyCode);
  }

  return btoa(encrypted);
};

export const decryptData = (encryptedData: string, key: string): string => {
  try {
    const decoded = atob(encryptedData);
    let decrypted = '';

    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode ^ keyCode);
    }

    return decrypted;
  } catch {
    return '';
  }
};

// SHA-256 password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'SALT_KEY_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// JWT-like token generation
export const generateToken = (userId: string, email: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

  const payload = btoa(
    JSON.stringify({
      userId,
      email,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  );

  const signature = btoa(hashString(`${header}.${payload}`));

  return `${header}.${payload}.${signature}`;
};

// Simple hash helper
const hashString = (str: string): string => {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return hash.toString(36);
};

// Rate Limiting using Token Bucket algorithm
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryConsume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Input validation and sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/['";]/g, '')
    .trim();
};

// CSRF Token generation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  return Array.from(array, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
};