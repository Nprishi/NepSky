// USER
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  profilePicture?: string;
  createdAt: string;
}

// AIRPORT
export interface Airport {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

// FLIGHT
export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;

  fromAirportId: string;
  toAirportId: string;

  departureTime: string;
  arrivalTime: string;
  duration: string;

  aircraft: string;

  flightType: "domestic" | "international";

  status?: "scheduled" | "delayed" | "cancelled";
}

// FLIGHT CLASS PRICING
export interface FlightClass {
  id: string;
  flightId: string;

  class: "Economy" | "Business" | "First";

  price: number;
  totalSeats: number;
  availableSeats: number;
}

// SEAT
export interface Seat {
  id: string;
  flightId: string;

  seatNumber: string;
  class: "Economy" | "Business" | "First";

  position: "window" | "middle" | "aisle";

  isAvailable: boolean;
}

// SEARCH FILTERS
export interface SearchFilters {
  fromAirportId: string;
  toAirportId: string;

  departureDate: string;
  returnDate?: string;

  passengers: number;

  class: "Economy" | "Business" | "First";

  tripType: "one-way" | "round-trip";

  flightType?: "domestic" | "international";
}

// PASSENGER
export interface Passenger {
  id: string;

  title: string;
  firstName: string;
  lastName: string;

  dateOfBirth: string;
  nationality: string;

  documentType?: "passport" | "national-id" | "license";
  documentNumber?: string;

  email: string;
  phone: string;
}

// BOOKING
export interface Booking {
  id: string;
  userId: string;
  flightId: string;

  passengers: Passenger[];

  seats: {
    seatId: string;
    passengerId: string;
  }[];

  travelClass: "Economy" | "Business" | "First";

  ticketNumber?: string;

  totalAmount: number;

  currency: "USD" | "NPR" | "EUR";

  status: "confirmed" | "pending" | "cancelled";

  bookingDate: string;

  paymentMethod: string;

  pnr: string;
}

// PAYMENT DETAILS (SECURE)====
export interface PaymentDetails {
  method:
    | "credit-card"
    | "debit-card"
    | "paypal"
    | "bank-transfer"
    | "esewa"
    | "khalti"
    | "ime-pay"
    | "mobile-banking"
    | "connect-ips";

  // Do NOT store sensitive card info in DB
  cardHolderName?: string;

  esewaId?: string;
  khaltiNumber?: string;
  mobileNumber?: string;
  bankAccount?: string;

  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  transactionId?: string;
  status?: "pending" | "paid" | "failed";
}

// TOTALS
export interface TotalsSummary {
  subtotal: number;
  taxes: number;
  serviceFee: number;
  total: number;
}
