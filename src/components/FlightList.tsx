import React, { useState, useEffect } from "react";
import {
  Plane,
  Users,
  ArrowLeft,
  Wifi,
  Coffee,
  Tv,
  Star,
  MapPin,
  Clock3,
} from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CurrencyDisplay from "./CurrencyDisplay";
import { supabase } from "../lib/supabase";
import { Flight } from "../types";
import {
  calculateHaversineDistance,
  estimateFlightTime,
} from "../utils/algorithms";
import {
  AirportCoordinate,
  AirportCoordinateMap,
  buildAirportCoordinateMap,
  extractAirportCode,
} from "../data/airportCoordinates";

interface FlightListProps {
  onNext: () => void;
  onBack: () => void;
}

const FlightList: React.FC<FlightListProps> = ({ onNext, onBack }) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [airportMap, setAirportMap] = useState<AirportCoordinateMap>({});
  const [loading, setLoading] = useState(true);
  const { searchFilters, setSelectedFlight } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadFlightsAndAirports = async () => {
      setLoading(true);

      try {
        let flightQuery = supabase
          .from("flights")
          .select("*")
          .eq("status", "scheduled")
          .gt("available_seats", 0)
          .order("departure_time", { ascending: true });

        // ALWAYS apply flight_type filter BEFORE other filters
        const flightType = (searchFilters?.flightType || "Domestic").toLowerCase();
        if (flightType === "domestic") {
          flightQuery = flightQuery.eq("flight_type", "domestic");
        } else if (flightType === "international") {
          flightQuery = flightQuery.eq("flight_type", "international");
        }

        // Then apply location filters if provided
        if (searchFilters) {
          if (searchFilters.from) {
            flightQuery = flightQuery.ilike(
              "from_location",
              `%${searchFilters.from}%`,
            );
          }
          if (searchFilters.to) {
            flightQuery = flightQuery.ilike(
              "to_location",
              `%${searchFilters.to}%`,
            );
          }
        }

        const [flightsResponse, airportsResponse] = await Promise.all([
          flightQuery,
          supabase
            .from("airport")
            .select("code, name, city, country, latitude, longitude"),
        ]);

        const { data: flightsData, error: flightsError } = flightsResponse;
        const { data: airportsData, error: airportsError } = airportsResponse;

        if (airportsError) {
          console.error("Error fetching airports:", airportsError);
          setAirportMap({});
        }

        // Build airport rows/map and a city->country lookup
        const airportRows: AirportCoordinate[] = (airportsData || []).map(
          (airport: any) => ({
            code: airport.code,
            name: airport.name,
            city: airport.city,
            country: airport.country,
            latitude: Number(airport.latitude),
            longitude: Number(airport.longitude),
          }),
        );

        const nextAirportMap = buildAirportCoordinateMap(airportRows);
        setAirportMap(nextAirportMap);

        const cityToCountry: Record<string, string> = {};
        airportRows.forEach((a) => {
          if (a.city && a.country)
            cityToCountry[a.city.trim().toLowerCase()] = a.country.trim();
        });

        if (flightsError) {
          console.error("Error fetching flights:", flightsError);
          setFlights([]);
        } else if (flightsData) {
          const mappedFlights: Flight[] = flightsData.map((f: any) => {
            const fromLoc = f.from_location || f.from || "";
            const toLoc = f.to_location || f.to || "";

            const fromCode = extractAirportCode(fromLoc);
            const toCode = extractAirportCode(toLoc);

            let fromCountry: string | undefined;
            let toCountry: string | undefined;

            if (fromCode && nextAirportMap[fromCode])
              fromCountry = nextAirportMap[fromCode].country;
            if (toCode && nextAirportMap[toCode])
              toCountry = nextAirportMap[toCode].country;

            if (!fromCountry && fromLoc)
              fromCountry = cityToCountry[fromLoc.trim().toLowerCase()];
            if (!toCountry && toLoc)
              toCountry = cityToCountry[toLoc.trim().toLowerCase()];

            const isInternational =
              !!fromCountry && !!toCountry && fromCountry !== toCountry;

            return {
              id: f.id,
              flightNumber: f.flight_number,
              airline: f.airline,
              from: f.from_location,
              to: f.to_location,
              departureTime: f.departure_time,
              arrivalTime: f.arrival_time,
              price: Number(f.price),
              duration: calculateDuration(f.departure_time, f.arrival_time),
              class: searchFilters?.class || "Economy",
              availableSeats: f.available_seats,
              totalSeats: f.total_seats,
              aircraft: f.aircraft_type,
              // meta
              isInternational,
            } as unknown as Flight;
          });

          setFlights(mappedFlights);
        }
      } catch (error) {
        console.error("Error fetching flight list data:", error);
        setFlights([]);
        setAirportMap({});
      } finally {
        setLoading(false);
      }
    };

    loadFlightsAndAirports();
  }, [searchFilters]);

  const calculateDuration = (departure: string, arrival: string): string => {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSelectFlight = (flight: Flight) => {
    if (!user) {
      // Save pending selection and require login before proceeding
      sessionStorage.setItem("pendingSelectedFlight", JSON.stringify(flight));
      // Ensure search filters are preserved as well
      if (searchFilters)
        sessionStorage.setItem("pendingSearch", JSON.stringify(searchFilters));
      navigate("/login");
      return;
    }

    setSelectedFlight(flight);
    onNext();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getAirportCode = (location: string) => {
    return extractAirportCode(location);
  };

  const getFlightDistance = (flight: Flight): number | null => {
    const fromCode = getAirportCode(flight.from);
    const toCode = getAirportCode(flight.to);

    const fromAirport = airportMap[fromCode];
    const toAirport = airportMap[toCode];

    if (!fromAirport || !toAirport) return null;

    return calculateHaversineDistance(
      {
        latitude: fromAirport.latitude,
        longitude: fromAirport.longitude,
      },
      {
        latitude: toAirport.latitude,
        longitude: toAirport.longitude,
      },
    );
  };

  if (!searchFilters) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <p className="text-gray-600">
          No search criteria found. Please search for flights first.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Available Flights
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose your best flight and continue booking
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 md:grid-cols-5">
          <div className="rounded-xl bg-white p-3 border border-gray-100">
            <span className="block text-xs text-gray-500 mb-1">From</span>
            <span className="font-semibold">{searchFilters.from}</span>
          </div>

          <div className="rounded-xl bg-white p-3 border border-gray-100">
            <span className="block text-xs text-gray-500 mb-1">To</span>
            <span className="font-semibold">{searchFilters.to}</span>
          </div>

          <div className="rounded-xl bg-white p-3 border border-gray-100">
            <span className="block text-xs text-gray-500 mb-1">Date</span>
            <span className="font-semibold">
              {formatDate(searchFilters.departureDate)}
            </span>
          </div>

          <div className="rounded-xl bg-white p-3 border border-gray-100">
            <span className="block text-xs text-gray-500 mb-1">Passengers</span>
            <span className="font-semibold">{searchFilters.passengers}</span>
          </div>

          <div className="rounded-xl bg-white p-3 border border-gray-100 col-span-2 md:col-span-1">
            <span className="block text-xs text-gray-500 mb-1">Class</span>
            <span className="font-semibold">{searchFilters.class}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-14">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600"></div>
          <span className="ml-3 text-gray-600">Searching flights...</span>
        </div>
      ) : flights.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-14 text-center shadow-sm">
          <Plane className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No flights found
          </h3>
          <p className="mb-6 text-gray-600">
            Try adjusting your search criteria or dates.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Modify Search
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {flights.length} flight{flights.length > 1 ? "s" : ""} found
              </span>
            </h3>
          </div>

          {flights.map((flight) => {
            const distance = getFlightDistance(flight);
            const estimatedAirTime =
              distance !== null ? estimateFlightTime(distance) : null;

            return (
              <div
                key={flight.id}
                className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-1">
                        <div className="text-center sm:min-w-[90px]">
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {formatTime(flight.departureTime)}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-600">
                            {getAirportCode(flight.from)}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {formatDate(flight.departureTime)}
                          </div>
                        </div>

                        <div className="flex-1 px-0 sm:px-4 lg:px-6">
                          <div className="flex items-center justify-center">
                            <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                            <div className="mx-3 rounded-full border border-primary-200 bg-primary-50 px-3 py-2 text-xs sm:text-sm font-medium text-primary-700">
                              <Plane className="mr-1 inline h-4 w-4" />
                              {flight.duration}
                            </div>
                            <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center">
                            <span className="text-xs font-medium text-gray-500">
                              {flight.aircraft}
                            </span>

                            {distance !== null && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {distance} km
                                </span>
                              </>
                            )}

                            {estimatedAirTime && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Air time {estimatedAirTime}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-center sm:min-w-[90px]">
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                            {formatTime(flight.arrivalTime)}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-600">
                            {getAirportCode(flight.to)}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {formatDate(flight.arrivalTime)}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-primary-50 px-5 py-4 text-center xl:min-w-[180px] xl:text-right">
                        <CurrencyDisplay
                          amount={flight.price}
                          className="mb-1 text-2xl sm:text-3xl font-bold text-primary-600"
                        />
                        <div className="text-sm text-gray-500">per person</div>
                        <div className="mt-2 flex items-center justify-center xl:justify-end">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span className="ml-1 text-sm text-gray-600">
                            4.8
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                          {flight.flightNumber}
                        </span>

                        <span className="text-sm font-medium text-gray-600">
                          {flight.airline}
                        </span>

                        <span className="flex items-center text-sm text-gray-600">
                          <Users className="mr-1 h-4 w-4" />
                          <span className="font-semibold">
                            {flight.availableSeats}
                          </span>
                          <span className="ml-1">seats left</span>
                        </span>

                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-100">
                          {flight.class}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Coffee className="mr-1 h-4 w-4" />
                          <span>Meals</span>
                        </div>
                        <div className="flex items-center">
                          <Tv className="mr-1 h-4 w-4" />
                          <span>Entertainment</span>
                        </div>
                      </div>
                    </div>

                    {distance !== null && (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
                        <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-center">
                          <p className="text-[11px] font-medium text-gray-500">
                            Flight Distance
                          </p>
                          <p className="text-sm font-bold text-primary-700">
                            {distance} km
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                          <p className="text-[11px] font-medium text-gray-500">
                            Estimated Air Time
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {estimatedAirTime}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="xl:ml-8 xl:w-auto">
                    <button
                      onClick={() => handleSelectFlight(flight)}
                      className="w-full rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-3.5 text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-primary-700 hover:to-primary-800 hover:shadow-lg xl:w-auto"
                    >
                      Select Flight
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightList;
