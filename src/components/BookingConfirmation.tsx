import React from 'react';
import {
  CheckCircle,
  Download,
  Mail,
  Calendar,
  Users,
  Plane,
  ShieldCheck,
  Clock3,
  CreditCard,
  Ticket,
  Luggage,
} from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { generateTicketPDF } from '../utils/ticketGenerator';
import { Link } from 'react-router-dom';
import CurrencyDisplay from './CurrencyDisplay';

const BookingConfirmation: React.FC = () => {
  const { currentBooking, selectedFlight, passengers } = useBooking();
  const [downloading, setDownloading] = React.useState(false);

  if (!currentBooking || !selectedFlight) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <p className="text-gray-600">No booking information found.</p>
      </div>
    );
  }

  const handleDownloadTicket = async () => {
    try {
      setDownloading(true);

      await generateTicketPDF({
        booking: currentBooking,
        flight: selectedFlight,
        passengers,
        selectedNationality: (currentBooking as any).selectedNationality,
        localCurrency: (currentBooking as any).localCurrency,
        exchangeRateAtBooking: (currentBooking as any).exchangeRateAtBooking,
        localAmountAtBooking: (currentBooking as any).localAmountAtBooking,
        bookingRateTimestamp: (currentBooking as any).bookingRateTimestamp,
      });
    } finally {
      setDownloading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAirportCode = (location: string) => {
    return location?.split('(')[1]?.replace(')', '') || location;
  };

  const getSeatLabel = (index: number) => {
    return currentBooking.seats?.[index] || 'Not assigned';
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-primary-50 shadow-sm">
        <div className="p-6 sm:p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-9 w-9 text-emerald-600" />
              </div>

              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Booking successful
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  Your flight is confirmed
                </h2>
                <p className="mt-2 max-w-2xl text-sm sm:text-base text-gray-600">
                  Your reservation has been completed successfully. Download your e-ticket
                  and keep it available for airport check-in and travel verification.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-100 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Booking Reference
              </p>
              <p className="mt-1 text-2xl font-bold tracking-[0.2em] text-primary-700">
                {currentBooking.pnr}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Issued on {formatDate(currentBooking.bookingDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-8">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800 p-6 text-white sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Flight Ticket</p>
                  <h3 className="mt-1 text-2xl font-bold">{selectedFlight.airline}</h3>
                  <p className="mt-1 text-sm text-white/80">
                    {selectedFlight.flightNumber} • {selectedFlight.aircraft}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-white/70">
                    Travel Date
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(selectedFlight.departureTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="text-center md:text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Departure
                  </p>
                  <p className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                    {formatTime(selectedFlight.departureTime)}
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-800">
                    {getAirportCode(selectedFlight.from)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{selectedFlight.from}</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex w-full min-w-[180px] items-center justify-center">
                    <div className="h-px flex-1 border-t border-dashed border-gray-300" />
                    <div className="mx-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                      <Plane className="h-5 w-5" />
                    </div>
                    <div className="h-px flex-1 border-t border-dashed border-gray-300" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-700">
                    {selectedFlight.duration}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Non-stop / Scheduled</p>
                </div>

                <div className="text-center md:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Arrival
                  </p>
                  <p className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
                    {formatTime(selectedFlight.arrivalTime)}
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-800">
                    {getAirportCode(selectedFlight.to)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">{selectedFlight.to}</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Cabin</p>
                  <p className="mt-1 font-semibold text-gray-900">{selectedFlight.class}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Passengers</p>
                  <p className="mt-1 font-semibold text-gray-900">{passengers.length}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Booking Date</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {new Date(currentBooking.bookingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="mt-1 font-semibold text-emerald-700">Confirmed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-primary-50 p-3 text-primary-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">
                  Passenger Details
                </h4>
                <p className="text-sm text-gray-500">
                  Review passenger names, seats, and travel documents
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {passengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 sm:p-5"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Passenger
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {passenger.title} {passenger.firstName} {passenger.lastName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Traveler {index + 1}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Seat
                      </p>
                      <p className="mt-1 font-semibold text-primary-700">
                        {getSeatLabel(index)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Passport
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {passenger.passportNumber || 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Nationality
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {passenger.nationality || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm sm:p-8">
            <h4 className="mb-5 text-xl font-semibold text-blue-950">
              Important Travel Information
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
                  <Clock3 className="h-4 w-4" />
                  Airport arrival
                </div>
                <p className="text-sm text-blue-800">
                  Please arrive at least 3 hours before departure for international travel.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
                  <Ticket className="h-4 w-4" />
                  Check-in
                </div>
                <p className="text-sm text-blue-800">
                  Online check-in usually opens 24 hours before scheduled departure.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
                  <ShieldCheck className="h-4 w-4" />
                  Passport validity
                </div>
                <p className="text-sm text-blue-800">
                  Ensure your passport remains valid for at least 6 months from the date of travel.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
                  <Luggage className="h-4 w-4" />
                  Baggage
                </div>
                <p className="text-sm text-blue-800">
                  Standard allowance: 23kg checked baggage and 7kg carry-on baggage.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-4 space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5">
                <h4 className="text-lg font-semibold text-gray-900">
                  Payment Summary
                </h4>
              </div>

              <div className="p-5">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Total paid
                  </p>
                  <CurrencyDisplay
                    amount={currentBooking.totalAmount}
                    className="mt-2 text-3xl font-bold text-emerald-700"
                  />
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Payment Method
                      </p>
                      <p className="mt-1 font-medium text-gray-900">
                        {currentBooking.paymentMethod.replace('-', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        Booking Date
                      </p>
                      <p className="mt-1 font-medium text-gray-900">
                        {formatDate(currentBooking.bookingDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="mb-4 text-lg font-semibold text-gray-900">
                Manage Booking
              </h4>

              <div className="mb-4 overflow-hidden rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white shadow-lg">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                        <Ticket className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75">
                          Digital Travel Document
                        </p>
                        <h5 className="mt-1 text-xl font-bold">Download E-Ticket</h5>
                        <p className="mt-1 text-sm text-white/80">
                          Save your ticket as PDF for airport check-in and travel records.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">
                        PNR
                      </p>
                      <p className="mt-1 text-sm font-bold tracking-[0.18em]">
                        {currentBooking.pnr}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <p className="text-white/70">Flight</p>
                      <p className="mt-1 font-semibold">{selectedFlight.flightNumber}</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <p className="text-white/70">Passengers</p>
                      <p className="mt-1 font-semibold">{passengers.length}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadTicket}
                    disabled={downloading}
                    className="mt-5 flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 font-semibold text-primary-700 shadow-sm transition hover:scale-[1.01] hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-400 border-t-primary-700" />
                        Generating Ticket...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download E-Ticket PDF
                      </>
                    )}
                  </button>

                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    This e-ticket uses the local currency and exchange rate saved at the exact booking timestamp.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-center rounded-2xl bg-gray-900 px-5 py-3.5 font-semibold text-white transition hover:bg-black"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Confirmation
                </button>

                <Link
                  to="/my-bookings"
                  className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  View All Bookings
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              A confirmation email has been sent to your registered email address.
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl text-center">
        <Link
          to="/"
          className="inline-flex items-center font-semibold text-primary-600 transition hover:text-primary-700"
        >
          Book Another Flight →
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;