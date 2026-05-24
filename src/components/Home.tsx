import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Plane,
  ArrowRightLeft,
  Star,
  Shield,
  Clock,
  Sparkles,
  Globe,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useBooking } from "../contexts/BookingContext";
import { supabase } from "../lib/supabase";
import { SearchFilters } from "../types";
import Footer from "../components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const featureCards = [
  {
    icon: Plane,
    title: "Modern Fleet",
    description:
      "Fly with confidence in our state-of-the-art aircraft equipped with the latest technology and safety features.",
    iconBg: "from-sky-100 to-blue-200",
    iconColor: "text-sky-700",
  },
  {
    icon: Star,
    title: "5-Star Service",
    description:
      "Our dedicated crew ensures your journey is comfortable, memorable, and exceeds your expectations.",
    iconBg: "from-amber-100 to-yellow-200",
    iconColor: "text-amber-700",
  },
  {
    icon: Globe,
    title: "Global Network",
    description:
      "Connect to destinations worldwide with our extensive route network spanning across continents.",
    iconBg: "from-purple-100 to-fuchsia-200",
    iconColor: "text-purple-700",
  },
];

const trustItems = [
  { icon: Shield, label: "Safe & Secure" },
  { icon: Star, label: "5-Star Service" },
  { icon: Clock, label: "24/7 Support" },
];

const visitedPlaces = [
  {
    title: "Dubai",
    country: "UAE",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    description:
      "Luxury skyline, desert adventure, shopping, and global transit hub.",
    tag: "Mostly Visited",
  },
  {
    title: "Singapore",
    country: "Singapore",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
    description:
      "Clean city, futuristic gardens, food culture, and premium travel experience.",
    tag: "Popular Route",
  },
  {
    title: "Paris",
    country: "France",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    description:
      "Romantic city breaks, iconic landmarks, art, fashion, and culture.",
    tag: "Top Destination",
  },
  {
    title: "Tokyo",
    country: "Japan",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    description:
      "Modern technology, traditional culture, nightlife, and world-class transit.",
    tag: "Trending",
  },
];

const topITCompanies = [
  {
    name: "Google",
    country: "United States",
    focus: "Search, AI, Cloud",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    wikipedia: "https://en.wikipedia.org/wiki/Google",
  },
  {
    name: "Microsoft",
    country: "United States",
    focus: "Cloud, Software, AI",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    wikipedia: "https://en.wikipedia.org/wiki/Microsoft",
  },
  {
    name: "Meta",
    country: "United States",
    focus: "Social Media, VR, AI",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png",
    wikipedia: "https://en.wikipedia.org/wiki/Meta_(company)",
  },
  {
    name: "SpaceX",
    country: "United States",
    focus: "Space Technology, Aerospace",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/d/de/SpaceX-Logo.svg",
    wikipedia: "https://en.wikipedia.org/wiki/SpaceX",
  },
  {
    name: "SAP",
    country: "Germany",
    focus: "Enterprise Software",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg",
    wikipedia: "https://en.wikipedia.org/wiki/SAP",
  },
  {
    name: "Infosys",
    country: "India",
    focus: "IT Services, Consulting",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg",
    wikipedia: "https://en.wikipedia.org/wiki/Infosys",
  },
];

type RecommendedFlight = {
  id: string;
  from_location: string;
  to_location: string;
  price: number;
  score: number;
};
const Home: React.FC = () => {
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    departureDate: "",
    returnDate: "",
    passengers: 1,
    class: "Economy" as "Economy" | "Business" | "First",
    tripType: "one-way" as "one-way" | "round-trip",
    flightType: "Domestic" as "Domestic" | "International",
  });

  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowFromSuggestions(false);
      setShowToSuggestions(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [cities, setCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  const { user } = useAuth();
  const { setSearchFilters } = useBooking();
  const navigate = useNavigate();

  const staticRecommendations = [
    {
      id: "rec-1",
      from_location: "Kathmandu",
      to_location: "Pokhara",
      price: 45,
      discount: "15% Off",
      // Updated reliable Pokhara link
      image:
        "https://tse3.mm.bing.net/th/id/OIP.Rc8LeQqbEgenlTZTmkH3bAHaDj?rs=1&pid=ImgDetMain&o=7&rm=3",
      tags: ["Best Seller", "Domestic"],
    },
    {
      id: "rec-2",
      from_location: "Kathmandu",
      to_location: "Dubai",
      price: 320,
      discount: "Early Bird",
      image:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=400",
      tags: ["International", "Popular"],
    },
    {
      id: "rec-3",
      from_location: "Kathmandu",
      to_location: "London",
      price: 850,
      discount: "Limited Deal",
      image:
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=400",
      tags: ["Dream Trip"],
    },
  ];

  // For recommendations
  const [recommendations, setRecommendations] = useState<RecommendedFlight[]>(
    [],
  );

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;

      try {
        const res = await fetch(
          `http://localhost:4000/recommendations?userId=${user.id}`,
        );

        const data: RecommendedFlight[] = await res.json();
        setRecommendations(data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchRecommendations();
  }, [user]);

  // Load cities based on flight type

  // useEffect(() => {
  //   loadCities(searchData.flightType);
  // }, [searchData.flightType]);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    const { data, error } = await supabase
      .from("flights")
      .select("from_location, to_location");

    if (error) {
      console.log(error);
      return;
    }

    const citySet = new Set<string>();

    data?.forEach((flight: any) => {
      if (flight.from_location) citySet.add(flight.from_location);
      if (flight.to_location) citySet.add(flight.to_location);
    });

    setCities(Array.from(citySet));
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: name === "passengers" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateSearch = () => {
    const newErrors: { [key: string]: string } = {};

    if (!searchData.from) newErrors.from = "Departure city is required";
    if (!searchData.to) newErrors.to = "Destination city is required";
    if (!searchData.departureDate)
      newErrors.departureDate = "Departure date is required";
    if (searchData.tripType === "round-trip" && !searchData.returnDate) {
      newErrors.returnDate = "Return date is required for round trip";
    }
    if (searchData.from === searchData.to) {
      newErrors.to = "Destination must be different from departure";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSearch()) return;

    const filters: SearchFilters = {
      from: searchData.from,
      to: searchData.to,
      departureDate: searchData.departureDate,
      returnDate:
        searchData.tripType === "round-trip"
          ? searchData.returnDate
          : undefined,
      passengers: Number(searchData.passengers),
      class: searchData.class,
      tripType: searchData.tripType,
    };

    setSearchFilters(filters);

    if (!user) {
      sessionStorage.setItem("pendingSearch", JSON.stringify(filters));
      navigate("/login");
    } else {
      navigate("/booking");
    }
  };

  const swapCities = () => {
    setSearchData((prev) => ({
      ...prev,
      from: prev.to || "",
      to: prev.from || "",
    }));
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900">
      <section className="relative isolate -mt-6">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,_white_0,_transparent_35%),radial-gradient(circle_at_bottom_right,_#60a5fa_0,_transparent_30%)]" />
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-30"
          >
            <source src="/landing.mp4" type="video/mp4" />
          </video>
        </div>
        <motion.div
          className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl"
          animate={{ y: [0, 16, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-20 h-96 w-96 rounded-full bg-fuchsia-400/10 blur-3xl"
          animate={{ y: [0, -18, 0], x: [0, -14, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-32 pt-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-40 lg:pt-24">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-center"
          >
            <motion.div
              variants={fadeUp}
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4" />
              Premium International Travel Experience
            </motion.div>

            <div className="relative h-40 overflow-hidden sm:h-44 md:h-48">
              <motion.div
                animate={{ y: ["0%", "-33.33%", "-66.66%", "0%"] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="space-y-2"
              >
                <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                  Fly Around the World
                </h1>
                <h1 className="text-4xl font-extrabold leading-tight text-transparent bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text sm:text-5xl lg:text-6xl xl:text-7xl">
                  Travel in Comfort
                </h1>
                <h1 className="text-4xl font-extrabold leading-tight text-transparent bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text sm:text-5xl lg:text-6xl xl:text-7xl">
                  Book Your Dream Route
                </h1>
              </motion.div>
            </div>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-2xl text-lg leading-8 text-blue-100/90 sm:text-xl"
            >
              Discover amazing destinations with International Airlines.
              Experience comfort, luxury, and exceptional service without
              changing your existing booking and backend workflow.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            {/* Search Form Container */}
            <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-sky-400/30 via-indigo-400/20 to-fuchsia-400/30 blur-2xl" />
            <section className="relative z-20 mt-4 px-4 sm:px-6 lg:px-2 lg:-mt-8">
              <div className="mx-auto">
                <div className="overflow-hidden rounded-[2rem] border border-white/50 bg-white/95 shadow-[0_20px_80px_rgba(15,23,42,0.15)] backdrop-blur-xl w-700">
                  {/* Header */}
                  <div className="border-b border-slate-200/70 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-100 px-4 py-4 md:px-8 lg:px-10">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
                          Search Flights
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 md:text-base">
                          Find the perfect flight for your next journey with
                          NepSky
                        </p>
                      </div>

                      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                          Live flight search
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSearch} className="p-6 md:p-8 lg:p-10">
                    {/* Trip Type */}
                    <div className="mb-8 flex flex-wrap gap-4">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="tripType"
                          value="one-way"
                          checked={searchData.tripType === "one-way"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div
                          className={`flex min-w-[150px] items-center justify-center gap-2 rounded-full 
                            border-2 px-6 py-3 text-sm font-semibold transition-all duration-300 md:text-base 
                            ${
                              searchData.tripType === "one-way"
                                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50"
                            }`}
                        >
                          <ArrowRight className="h-4 w-4" />

                          <span className="whitespace-nowrap">One Way</span>
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="tripType"
                          value="round-trip"
                          checked={searchData.tripType === "round-trip"}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div
                          className={`flex min-w-[160px] items-center justify-center gap-2 rounded-full
                             border-2 px-6 py-3 text-sm font-semibold transition-all duration-300 md:text-base 
                             ${
                               searchData.tripType === "round-trip"
                                 ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                                 : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50"
                             }`}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          <span className="whitespace-nowrap">Round Trip</span>
                        </div>
                      </label>
                    </div>

                    {/* Flight Type */}
                    {/* <div className="mb-6 flex flex-wrap gap-4">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="flightType"
                          value="Domestic"
                          checked={searchData.flightType === 'Domestic'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div
                          className={`flex min-w-[160px] items-center justify-center rounded-full border-2 px-6 py-3 text-sm font-semibold transition-all duration-300 md:text-base
      ${searchData.flightType === 'Domestic'
                              ? 'border-green-600 bg-green-50 text-green-700 shadow-md'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:bg-slate-50'
                            }`}
                        >
                          Domestic
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="flightType"
                          value="International"
                          checked={searchData.flightType === 'International'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div
                          className={`flex min-w-[160px] items-center justify-center rounded-full border-2 px-6 py-3 text-sm font-semibold transition-all duration-300 md:text-base
      ${searchData.flightType === 'International'
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                            }`}
                        >
                          International
                        </div>
                      </label>
                    </div> */}

                    {/* Top row */}
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                      {/* Departure */}
                      <div className="xl:col-span-5 relative">
                        <div className="group relative rounded-2xl border-2 border-slate-200 bg-white px-4 pb-3 pt-2 transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500">
                          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <MapPin className="h-3.5 w-6" />
                            Departure
                          </div>
                          <input
                            type="text"
                            placeholder="Type city name..."
                            value={searchData.from || fromQuery}
                            onChange={(e) => {
                              setFromQuery(e.target.value);
                              setSearchData((prev) => ({
                                ...prev,
                                from: e.target.value,
                              }));
                              setShowFromSuggestions(true);
                            }}
                            onFocus={() => setShowFromSuggestions(true)}
                            className="w-full bg-transparent text-base font-medium text-slate-900 outline-none md:text-lg"
                          />
                        </div>

                        {/* Suggestions Dropdown */}
                        {showFromSuggestions && fromQuery && (
                          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl backdrop-blur-lg">
                            {cities
                              .filter((city) =>
                                city
                                  .toLowerCase()
                                  .includes(fromQuery.toLowerCase()),
                              )
                              .map((city) => (
                                <div
                                  key={city}
                                  className="cursor-pointer px-4 py-3 hover:bg-blue-50 text-slate-700 font-medium transition-colors"
                                  onClick={() => {
                                    setSearchData((prev) => ({
                                      ...prev,
                                      from: city,
                                    }));
                                    setFromQuery(city);
                                    setShowFromSuggestions(false);
                                  }}
                                >
                                  {city}
                                </div>
                              ))}
                          </div>
                        )}
                        {errors.from && (
                          <p className="mt-2 text-sm text-red-600">
                            {errors.from}
                          </p>
                        )}
                      </div>

                      {/* Swap */}
                      <div className="xl:col-span-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={swapCities}
                          className="flex h-[72px] w-full max-w-[90px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:text-blue-600 hover:shadow-xl"
                        >
                          <ArrowRightLeft className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Destination Search */}
                      <div
                        className="xl:col-span-5 relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="group relative rounded-2xl border-2 border-slate-200 bg-white px-4 pb-3 pt-2 transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-100">
                          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <MapPin className="h-3.5 w-3.5" />
                            Destination
                          </div>
                          <input
                            type="text"
                            name="to"
                            placeholder="Where to?"
                            autoComplete="off"
                            value={searchData.to}
                            onFocus={() => setShowToSuggestions(true)}
                            onChange={(e) => {
                              handleInputChange(e);
                              setShowToSuggestions(true);
                            }}
                            className="w-full bg-transparent text-base font-medium text-slate-900 outline-none md:text-lg placeholder:text-slate-300"
                          />
                        </div>

                        {/* Destination Suggestions Dropdown */}
                        {showToSuggestions && searchData.to && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl"
                          >
                            {cities.filter((city) =>
                              city
                                .toLowerCase()
                                .includes(searchData.to.toLowerCase()),
                            ).length > 0 ? (
                              cities
                                .filter((city) =>
                                  city
                                    .toLowerCase()
                                    .includes(searchData.to.toLowerCase()),
                                )
                                .map((city) => (
                                  <div
                                    key={city}
                                    className="flex items-center gap-3 cursor-pointer px-4 py-3 hover:bg-blue-50 text-slate-700 transition-colors border-b border-slate-50 last:border-none"
                                    onClick={() => {
                                      setSearchData((prev) => ({
                                        ...prev,
                                        to: city,
                                      }));
                                      setShowToSuggestions(false);
                                    }}
                                  >
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    <span className="font-medium">{city}</span>
                                  </div>
                                ))
                            ) : (
                              <div className="px-4 py-8 text-center text-slate-500 italic">
                                No destinations found matching "{searchData.to}"
                              </div>
                            )}
                          </motion.div>
                        )}
                        {errors.to && (
                          <p className="mt-2 text-sm text-red-600">
                            {errors.to}
                          </p>
                        )}
                      </div>

                      {/* Departure Date */}
                      <div className="xl:col-span-6">
                        <div className="group relative rounded-2xl border-2 border-slate-200 bg-white px-4 pb-3 pt-2 transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-100">
                          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            Departure Date
                          </div>
                          <input
                            type="date"
                            name="departureDate"
                            value={searchData.departureDate}
                            onChange={handleInputChange}
                            /* Reliable constraint: Cannot book in the past */
                            min={new Date().toISOString().split("T")[0]}
                            /* Professional constraint: Cannot book more than 1 year (365 days) in the future */
                            max={
                              new Date(
                                new Date().setFullYear(
                                  new Date().getFullYear() + 1,
                                ),
                              )
                                .toISOString()
                                .split("T")[0]
                            }
                            className="w-full bg-transparent text-base font-medium text-slate-900 outline-none md:text-lg"
                          />
                        </div>
                        {errors.departureDate && (
                          <p className="mt-2 text-sm text-red-600">
                            {errors.departureDate}
                          </p>
                        )}
                      </div>

                      {/* Return Date */}
                      {searchData.tripType === "round-trip" && (
                        <div className="xl:col-span-6">
                          <div className="group relative rounded-2xl border-2 border-slate-200 bg-white px-4 pb-3 pt-2 transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-100">
                            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              <Calendar className="h-3.5 w-3.5" />
                              Return Date
                            </div>
                            <input
                              type="date"
                              name="returnDate"
                              value={searchData.returnDate}
                              onChange={handleInputChange}
                              /* Reliable constraint: Cannot return before the departure date (or today) */
                              min={
                                searchData.departureDate ||
                                new Date().toISOString().split("T")[0]
                              }
                              /* Industry constraint: Maximum 1 year in the future */
                              max={
                                new Date(
                                  new Date().setFullYear(
                                    new Date().getFullYear() + 1,
                                  ),
                                )
                                  .toISOString()
                                  .split("T")[0]
                              }
                              className="w-full bg-transparent text-base font-medium text-slate-900 outline-none md:text-lg"
                            />
                          </div>
                          {errors.returnDate && (
                            <p className="mt-2 text-sm text-red-600">
                              {errors.returnDate}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom row */}
                    <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
                      {/* Passengers */}
                      <div className="xl:col-span-6">
                        <div className="group relative rounded-2xl border-2 border-slate-200 bg-white px-4 pb-3 pt-2 transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-100">
                          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <Users className="h-3.5 w-3.5" />
                            Passengers
                          </div>
                          <select
                            name="passengers"
                            value={searchData.passengers}
                            onChange={handleInputChange}
                            className="w-full bg-transparent text-base font-medium text-slate-900 outline-none md:text-lg"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? "Passenger" : "Passengers"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Travel Class */}
                      <div className="xl:col-span-6">
                        <div className="group relative rounded-2xl border-2 border-slate-200 bg-white px-4 pb-3 pt-2 transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-100">
                          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <img
                              src="/plane.png"
                              alt="Plane"
                              className="h-3.5 w-3.5 object-contain"
                            />
                            Travel Class
                          </div>
                          <select
                            name="class"
                            value={searchData.class}
                            onChange={handleInputChange}
                            className="w-full bg-transparent text-base font-medium text-slate-900 outline-none md:text-lg"
                          >
                            <option value="Economy">Economy Class</option>
                            <option value="Business">Business Class</option>
                            <option value="First">First Class</option>
                          </select>
                        </div>
                      </div>

                      {/* Search Button */}
                      <div className="xl:col-span-12">
                        <button
                          type="submit"
                          className="group flex h-[50px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/30 md:text-lg"
                        >
                          <Search className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                          <span className="whitespace-nowrap">
                            Search Flights
                          </span>
                          <span className="shrink-0 transition-transform duration-300 group-hover:translate-x-1">
                            →
                          </span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 -mt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mt-20">
              Why Choose NepSky?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Experience the best in air travel with our premium services and
              world-class amenities.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  variants={fadeUp}
                  whileHover={{ y: -8 }}
                  className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-lg shadow-slate-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500" />
                  <div
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconBg} shadow-inner transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`h-8 w-8 ${card.iconColor}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-4 leading-7 text-slate-600">
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Mostly Visited Places
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Explore some of the most loved travel destinations chosen by
              travelers around the world.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {visitedPlaces.map((place, index) => (
              <motion.div
                key={place.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -8 }}
                className="group overflow-hidden rounded-3xl border border-white/60 bg-white shadow-lg shadow-slate-200/60"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
                    {place.tag}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-2xl font-bold">{place.title}</h3>
                    <p className="mt-1 text-sm text-white/85">
                      {place.country}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-7 text-slate-600">
                    {place.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <span>Explore destination</span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* //Recommendations section */}
      <section className="pb-0">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900">
            Recommended Flights
          </h2>

          <p className="text-center text-slate-600 mt-3 mb-10">
            Hand-picked deals based on current travel trends
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg hover:shadow-2xl transition"
              >
                <h3 className="text-lg font-bold">
                  {f.from_location} → {f.to_location}
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Score: {f.score?.toFixed(2)}
                </p>

                <p className="text-blue-600 font-semibold mt-2">
                  NPR {f.price}
                </p>

                <button className="mt-5 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-0 mb-20 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
            </div>
            <div className="hidden sm:block">
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all deals <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {staticRecommendations.map((flight) => (
              <motion.div
                key={flight.id}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl hover:border-blue-100"
              >
                {/* Image Header */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={flight.image}
                    alt={flight.to_location}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {flight.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-sm font-medium opacity-80">
                      Starting from
                    </p>
                    <p className="text-2xl font-bold">${flight.price}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          From
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {flight.from_location}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          To
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {flight.to_location}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                      <p className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                        Save
                      </p>
                      <p className="text-sm font-black text-blue-700">
                        {flight.discount}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/booking")}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-95"
                  >
                    Book This Flight
                    <Plane className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <h2 className="left-1/2 top-0 w-full text-lg font-semibold tracking-wide text-white bg-blue-400 rounded-full px-3 py-1">
              Sponsored
            </h2>

            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Top Tech Companies Worldwide
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Discover globally recognized technology companies.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {topITCompanies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl"
              >
                {/* Background glow */}
                <div className="absolute right-0 top-0 h-28 w-28 bg-blue-200/30 blur-2xl group-hover:bg-indigo-300/40 transition-all duration-300" />

                {/* Logo */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-white shadow flex items-center justify-center p-2">
                    <img
                      src={company.image}
                      alt={company.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {company.name}
                    </h3>
                    <p className="text-sm text-slate-500">{company.country}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase text-slate-400">Core Focus</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {company.focus}
                  </p>
                </div>

                {/* Hover Button */}
                <div className="mt-5 flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    Global Tech Leader
                  </span>
                  <a
                    href={company.wikipedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-indigo-700 transition"
                  >
                    View →
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
