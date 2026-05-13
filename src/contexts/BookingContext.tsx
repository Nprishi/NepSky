import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Flight, SearchFilters, Passenger, Booking, PaymentDetails } from '../types';

interface BookingContextType {
  searchFilters: SearchFilters | null;
  selectedFlight: Flight | null;
  passengers: Passenger[];
  selectedSeats: string[];
  paymentDetails: PaymentDetails | null;
  currentBooking: Booking | null;

  // 🌐 Currency system
  exchangeRateUSDToNPR: number | null;
  currency: 'USD' | 'NPR';
  setCurrency: (c: 'USD' | 'NPR') => void;
  convertPrice: (usdPrice: number) => number;

  setSearchFilters: (filters: SearchFilters) => void;
  setSelectedFlight: (flight: Flight) => void;
  setPassengers: (passengers: Passenger[]) => void;
  setSelectedSeats: (seats: string[]) => void;
  setPaymentDetails: (payment: PaymentDetails) => void;
  createBooking: (userId: string) => Promise<Booking | null>;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

type ExtendedBooking = Booking & {
  selectedNationality?: string;
  localCurrency?: string;
  exchangeRateAtBooking?: number;
  localAmountAtBooking?: number;
  bookingRateTimestamp?: string;
};

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  // 🌐 Currency state 
  const [exchangeRateUSDToNPR, setExchangeRateUSDToNPR] = useState<number | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'NPR'>('NPR');

  // 🌐 Fetch exchange rate (ADD THIS)
  React.useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/exchange/usd-npr');
        const data = await res.json();

        if (data?.rate) {
          setExchangeRateUSDToNPR(data.rate);
        }
      } catch (err) {
        console.error('Exchange rate fetch failed', err);
      }
    };

    fetchRate();
  }, []);

  // 🌐 Convert USD → selected currency
  const convertPrice = (usdPrice: number): number => {
    if (!exchangeRateUSDToNPR) return usdPrice;

    if (currency === 'USD') return usdPrice;

    return Number((usdPrice * exchangeRateUSDToNPR).toFixed(2));
  };

  const calculateSeatFee = (seat: string): number => {
    if (seat.includes('A') || seat.includes('F')) return 25;
    if (seat.includes('C') || seat.includes('D')) return 15;
    return 0;
  };

  const calculateTotalAmount = (): number => {
    if (!selectedFlight) return 0;

    let total = selectedFlight.price * passengers.length;

    selectedSeats.forEach((seat) => {
      total += calculateSeatFee(seat);
    });

    return Number(total.toFixed(2));
  };

  const generatePNR = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const normalizeNationality = (value?: string): string => {
    return (value || '').trim().toLowerCase();
  };

  const resolveLocalCurrencyFromNationality = (nationality?: string): string => {
    const n = normalizeNationality(nationality);

    const currencyMap: Record<string, string> = {
      nepal: 'NPR',
      nepali: 'NPR',
      india: 'INR',
      indian: 'INR',
      usa: 'USD',
      'united states': 'USD',
      american: 'USD',
      canada: 'CAD',
      canadian: 'CAD',
      australia: 'AUD',
      australian: 'AUD',
      uk: 'GBP',
      britain: 'GBP',
      british: 'GBP',
      'united kingdom': 'GBP',
      germany: 'EUR',
      france: 'EUR',
      italy: 'EUR',
      spain: 'EUR',
      portugal: 'EUR',
      netherlands: 'EUR',
      europe: 'EUR',
      japan: 'JPY',
      japanese: 'JPY',
      china: 'CNY',
      chinese: 'CNY',
      singapore: 'SGD',
      uae: 'AED',
      dubai: 'AED',
      qatar: 'QAR',
      malaysia: 'MYR',
      thailand: 'THB',
      'south korea': 'KRW',
      korea: 'KRW',
    };

    return currencyMap[n] || 'USD';
  };

  const resolveExchangeRateAtBooking = async (currencyCode: string): Promise<number> => {
    if (currencyCode === 'USD') return 1;

    const { data: settings } = await supabase.from('site_settings').select('*').maybeSingle();

    if (!settings) {
      if (currencyCode === 'NPR') return 132.5;
      return 1;
    }

    const dynamicColumn = `usd_to_${currencyCode.toLowerCase()}_rate`;
    const dynamicRate = settings[dynamicColumn];

    if (typeof dynamicRate === 'number' && dynamicRate > 0) {
      return dynamicRate;
    }

    if (currencyCode === 'NPR' && typeof settings.usd_to_npr_rate === 'number') {
      return settings.usd_to_npr_rate;
    }

    return 1;
  };

  const insertBookedSeats = async (
    bookingId: string,
    userId: string,
    bookingRateTimestamp: string
  ) => {
    if (!selectedFlight || selectedSeats.length === 0) return { ok: true };

    const seatRows = selectedSeats.map((seatNumber, index) => {
      const passenger = passengers[index];
      return {
        booking_id: bookingId,
        flight_id: selectedFlight.id,
        user_id: userId,
        passenger_index: index + 1,
        passenger_name: passenger
          ? `${passenger.title || ''} ${passenger.firstName || ''} ${passenger.lastName || ''}`
            .replace(/\s+/g, ' ')
            .trim()
          : `Passenger ${index + 1}`,
        passenger_email: passenger?.email || null,
        seat_number: seatNumber,
        seat_class: selectedFlight.class || 'Economy',
        seat_price: calculateSeatFee(seatNumber),
        status: 'booked',
        created_at: bookingRateTimestamp,
      };
    });

    const { error } = await supabase.from('booked_seats').insert(seatRows);

    if (error) {
      console.error('❌ booked_seats insert error:', error);
      return { ok: false, error };
    }

    return { ok: true };
  };

  const createBooking = async (userId: string): Promise<Booking | null> => {
    console.log('createBooking called with userId:', userId);

    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!selectedFlight || passengers.length === 0) {
      console.error('Missing booking information:', { selectedFlight, passengers });
      throw new Error('Missing required booking information');
    }

    if (selectedSeats.length !== passengers.length) {
      console.error('Seat count mismatch:', {
        passengers: passengers.length,
        selectedSeats: selectedSeats.length,
      });
      throw new Error('Please select seats for all passengers');
    }

    try {
      const totalAmount = calculateTotalAmount();
      const bookingReference = generatePNR();
      const primaryPassenger = passengers[0];
      const selectedNationality = primaryPassenger?.nationality || 'Not Specified';
      const localCurrency = resolveLocalCurrencyFromNationality(selectedNationality);
      const exchangeRateAtBooking = await resolveExchangeRateAtBooking(localCurrency);
      const bookingRateTimestamp = new Date().toISOString();
      const localAmountAtBooking = Number((totalAmount * exchangeRateAtBooking).toFixed(2));

      const bookingInsertData = {
        user_id: userId,
        flight_id: selectedFlight.id,
        passenger_name: `${primaryPassenger.firstName} ${primaryPassenger.lastName}`,
        passenger_email: primaryPassenger.email,
        passenger_phone: primaryPassenger.phone,
        seat_number: selectedSeats.join(', '),
        booking_reference: bookingReference,
        payment_status: 'completed',
        payment_method: paymentDetails?.method || 'credit-card',
        total_amount: totalAmount,
        status: 'confirmed',
        selected_nationality: selectedNationality,
        local_currency: localCurrency,
        exchange_rate_at_booking: exchangeRateAtBooking,
        local_amount_at_booking: localAmountAtBooking,
        booking_rate_timestamp: bookingRateTimestamp,
      };

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingInsertData])
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Booking creation error:', bookingError);
        alert(`Database Error: ${bookingError.message}`);
        return null;
      }

      const bookedSeatResult = await insertBookedSeats(
        bookingData.id,
        userId,
        bookingRateTimestamp
      );

      if (!bookedSeatResult.ok) {
        const seatError: any = bookedSeatResult.error;

        if (seatError?.code === '23505') {
          alert('One or more selected seats were already booked. Please choose different seats.');
        } else {
          alert(`Seat booking failed: ${seatError?.message || 'Unknown error'}`);
        }

        await supabase.from('bookings').delete().eq('id', bookingData.id);
        return null;
      }

      const { error: paymentError } = await supabase.from('payments').insert([
        {
          booking_id: bookingData.id,
          user_id: userId,
          amount_usd: totalAmount,
          amount_local: localAmountAtBooking,
          local_currency: localCurrency,
          exchange_rate: exchangeRateAtBooking,
          exchange_rate_timestamp: bookingRateTimestamp,
          payment_method: paymentDetails?.method || 'credit-card',
          payment_gateway: 'stripe',
          transaction_id: `TXN-${Date.now()}`,
          status: 'completed',
        },
      ]);

      if (paymentError) {
        console.error('⚠ Payment record creation error:', paymentError);
      }

      const { error: updateError } = await supabase
        .from('flights')
        .update({ available_seats: selectedFlight.availableSeats - passengers.length })
        .eq('id', selectedFlight.id);

      if (updateError) {
        console.error('⚠ Flight seat update error:', updateError);
      }

      const booking: ExtendedBooking = {
        id: bookingData.id,
        userId,
        flightId: selectedFlight.id,
        passengers,
        seats: selectedSeats,
        totalAmount,
        status: 'confirmed',
        bookingDate: bookingData.created_at,
        paymentMethod: paymentDetails?.method || 'credit-card',
        pnr: bookingReference,
        selectedNationality,
        localCurrency,
        exchangeRateAtBooking,
        localAmountAtBooking,
        bookingRateTimestamp,
      };

      setCurrentBooking(booking);
      return booking;
    } catch (error) {
      console.error('❌ Booking error:', error);
      return null;
    }
  };

  const clearBooking = () => {
    setSearchFilters(null);
    setSelectedFlight(null);
    setPassengers([]);
    setSelectedSeats([]);
    setPaymentDetails(null);
    setCurrentBooking(null);
  };

  const value: BookingContextType = {
    searchFilters,
    selectedFlight,
    passengers,
    selectedSeats,
    paymentDetails,
    currentBooking,
    setSearchFilters,
    setSelectedFlight,
    setPassengers,
    setSelectedSeats,
    setPaymentDetails,
    createBooking,
    clearBooking,

    // 🌐 Currency
    exchangeRateUSDToNPR,
    currency,
    setCurrency,
    convertPrice,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};