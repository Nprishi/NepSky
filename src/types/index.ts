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

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  aircraft: string;
  class: 'Economy' | 'Business' | 'First';
}

export interface SearchFilters {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  class: 'Economy' | 'Business' | 'First';
  tripType: 'one-way' | 'round-trip';
}

export interface Passenger {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  email: string;
  phone: string;
}

export interface Seat {
  id: string;
  seatNumber: string;
  class: 'Economy' | 'Business' | 'First';
  isAvailable: boolean;
  price: number;
  position: 'window' | 'middle' | 'aisle';
}

export interface Booking {
  id: string;
  userId: string;
  flightId: string;
  passengers: Passenger[];
  seats: string[];
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookingDate: string;
  paymentMethod: string;
  pnr: string;

  // new fields
  baseCurrency?: 'USD';
  localCurrency?: string;
  selectedNationality?: string;
  exchangeRateAtBooking?: number;
  localAmountAtBooking?: number;
}

export interface PaymentDetails {
  method: 'credit-card' | 'debit-card' | 'paypal' | 'bank-transfer' | 'esewa' | 'khalti' | 'ime-pay' | 'mobile-banking' | 'connect-ips';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
  // Nepal-specific payment fields
  esewaId?: string;
  khaltiNumber?: string;
  mobileNumber?: string;
  bankAccount?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface TotalsSummary {
  subtotal: number;
  taxes: number;
  serviceFee: number;
  total: number;
}