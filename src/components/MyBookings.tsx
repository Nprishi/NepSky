import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Download,
  Mail,
  XCircle,
  Plane,
  Printer,
  Ticket,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { generateTicketPDF } from '../utils/ticketGenerator';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          flight:flights(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        setBookings([]);
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getFlightDetails = (booking: any) => booking.flight;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAirportCode = (location?: string) => {
    if (!location) return 'N/A';
    const match = location.match(/\(([^)]+)\)/);
    if (match?.[1]) return match[1];
    return location.slice(0, 3).toUpperCase();
  };

  const getDuration = (departure: string, arrival: string) => {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getCancellationDeadline = (bookingDate: string) => {
    const bookingTime = new Date(bookingDate);
    return new Date(bookingTime.getTime() + 2 * 60 * 60 * 1000);
  };

  const canCancelBooking = (booking: any) => {
    if (
      booking.status === 'cancelled' ||
      booking.status === 'completed' ||
      booking.status === 'pending_cancellation'
    ) {
      return false;
    }

    const deadline = getCancellationDeadline(booking.created_at);
    return currentTime < deadline;
  };

  const getTimeRemaining = (bookingDate: string) => {
    const deadline = getCancellationDeadline(bookingDate);
    const diff = deadline.getTime() - currentTime.getTime();

    if (diff <= 0) {
      return { expired: true, text: 'Cancellation period expired' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      expired: false,
      text: `${hours}h ${minutes}m ${seconds}s remaining`,
    };
  };

  const formatDeadlineTime = (bookingDate: string) => {
    const deadline = getCancellationDeadline(bookingDate);
    return deadline.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'pending_cancellation':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'completed':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const buildTicketData = (booking: any) => {
    const flight = getFlightDetails(booking);
    if (!flight) return null;

    const passengerNameParts = (booking.passenger_name || '').split(' ');
    const firstName = passengerNameParts[0] || 'Passenger';
    const lastName = passengerNameParts.slice(1).join(' ') || '';

    const passenger = {
      id: '1',
      title: 'Mr',
      firstName,
      lastName,
      email: booking.passenger_email || '',
      phone: booking.passenger_phone || '',
      dateOfBirth: '',
      passportNumber: '',
      nationality: booking.selected_nationality || '',
    };

    return {
      booking: {
        id: booking.id,
        userId: booking.user_id,
        flightId: booking.flight_id,
        passengers: [passenger],
        seats: String(booking.seat_number || '')
          .split(',')
          .map((seat: string) => seat.trim())
          .filter(Boolean),
        totalAmount: Number(booking.total_amount || 0),
        status: booking.status,
        bookingDate: booking.created_at,
        paymentMethod: booking.payment_method,
        pnr: booking.booking_reference,
        baseAmountUSD: Number(booking.total_amount || 0),
        exchangeRatesAtBooking: booking.exchange_rate_at_booking || 1,
        localCurrency: booking.local_currency || 'USD',
        localAmount: Number(booking.local_amount_at_booking || booking.total_amount || 0),
        paymentStatus: booking.status === 'confirmed' ? 'completed' : booking.status,
      },
      flight: {
        id: flight.id,
        flightNumber: flight.flight_number,
        airline: flight.airline,
        from: flight.from_location,
        to: flight.to_location,
        departureTime: flight.departure_time,
        arrivalTime: flight.arrival_time,
        price: Number(flight.price || 0),
        duration: getDuration(flight.departure_time, flight.arrival_time),
        class: 'Economy' as const,
        availableSeats: flight.available_seats,
        aircraft: flight.aircraft_type,
      },
      passengers: [passenger],
      selectedNationality: booking.selected_nationality,
      localCurrency: booking.local_currency,
      exchangeRateAtBooking: booking.exchange_rate_at_booking,
      localAmountAtBooking: booking.local_amount_at_booking,
      bookingRateTimestamp: booking.booking_rate_timestamp,
    };
  };

  const handleDownloadTicket = async (booking: any) => {
    const ticketData = buildTicketData(booking);
    console.log("TicketData object after buildTicketData:", ticketData);
    if (!ticketData) return;

    try {
      setDownloadingId(booking.id);
      await generateTicketPDF(ticketData, { mode: 'download' });
    } catch (error) {
      console.error('Ticket download failed:', error);
      alert('Failed to generate ticket PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintTicket = async (booking: any) => {

    const ticketData = buildTicketData(booking);
    console.log("TicketData object after buildTicketData:", ticketData);
    if (!ticketData) return;

    try {
      await generateTicketPDF(ticketData, { mode: 'print' });
    } catch (error) {
      console.error('Ticket print failed:', error);
      alert('Failed to open print ticket.');
    }
  };

  const handleCancelBooking = async (booking: any) => {
    if (booking.status === 'cancelled') {
      alert('This booking is already cancelled.');
      return;
    }

    if (booking.status === 'completed') {
      alert('Cannot cancel a completed flight.');
      return;
    }

    if (!canCancelBooking(booking)) {
      alert('Cancellation period has expired. You can only cancel within 2 hours of booking.');
      return;
    }

    const confirmCancel = confirm(
      `Are you sure you want to cancel this booking?\n\n` +
      `Flight: ${booking.flight?.flight_number}\n` +
      `Booking Reference: ${booking.booking_reference}\n\n` +
      `You will be notified once the admin processes your cancellation request.`
    );

    if (!confirmCancel) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          cancelled_by_user: true,
          status: 'cancelled',
        })
        .eq('id', booking.id);

      if (error) {
        console.error('Error cancelling booking:', error);

        if (error.message && error.message.includes('cancellation window')) {
          alert(
            'Cancellation Failed: The 2-hour cancellation window has expired. You can only cancel within 2 hours of booking.'
          );
        } else {
          alert('Failed to cancel booking. Please contact support or try again.');
        }
      } else {
        alert('Booking cancelled successfully! The cancellation has been processed.');
        loadBookings();
      }
    } catch (error: any) {
      console.error('Error cancelling booking:', error);

      if (error?.message && error.message.includes('cancellation window')) {
        alert(
          'Cancellation Failed: The 2-hour cancellation window has expired. You can only cancel within 2 hours of booking.'
        );
      } else {
        alert('Failed to cancel booking. Please contact support or try again.');
      }
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600">Please log in to view your bookings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-primary-700 to-sky-600 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Travel Center
                </p>
                <h1 className="text-3xl font-bold sm:text-4xl">My Bookings</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
                  Manage your reservations, download your e-ticket PDF, print your ticket,
                  and track cancellation eligibility.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-white/70">Total Bookings</p>
                  <p className="mt-1 text-2xl font-bold">{bookings.length}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-white/70">Confirmed</p>
                  <p className="mt-1 text-2xl font-bold">
                    {bookings.filter((b) => b.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold text-slate-900">No bookings found</h3>
            <p className="mb-6 text-slate-600">You haven't made any flight bookings yet.</p>
            <Link
              to="/"
              className="inline-flex items-center rounded-2xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700"
            >
              Book Your First Flight
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const flight = getFlightDetails(booking);
              if (!flight) return null;

              const remaining = getTimeRemaining(booking.created_at);

              return (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-6 py-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(
                            booking.status
                          )}`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>

                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          PNR: {booking.booking_reference}
                        </span>

                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {flight.airline} • {flight.flight_number}
                        </span>
                      </div>

                      <div className="text-left xl:text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Total Paid</p>
                        <p className="text-2xl font-bold text-primary-700">
                          ${Number(booking.total_amount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.5fr_1fr]">
                      <div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                          <div className="text-center lg:text-left">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Departure
                            </p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                              {formatTime(flight.departure_time)}
                            </p>
                            <p className="mt-2 text-base font-semibold text-slate-800">
                              {getAirportCode(flight.from_location)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{flight.from_location}</p>
                          </div>

                          <div className="flex flex-col items-center">
                            <div className="flex w-full min-w-[170px] items-center justify-center">
                              <div className="h-px flex-1 border-t border-dashed border-slate-300" />
                              <div className="mx-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                                <Plane className="h-5 w-5" />
                              </div>
                              <div className="h-px flex-1 border-t border-dashed border-slate-300" />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-700">
                              {getDuration(flight.departure_time, flight.arrival_time)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{flight.aircraft_type}</p>
                          </div>

                          <div className="text-center lg:text-right">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Arrival
                            </p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                              {formatTime(flight.arrival_time)}
                            </p>
                            <p className="mt-2 text-base font-semibold text-slate-800">
                              {getAirportCode(flight.to_location)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{flight.to_location}</p>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Passenger
                            </p>
                            <p className="mt-2 flex items-center font-semibold text-slate-900">
                              <Users className="mr-2 h-4 w-4 text-slate-500" />
                              {booking.passenger_name}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Seat
                            </p>
                            <p className="mt-2 flex items-center font-semibold text-slate-900">
                              <Ticket className="mr-2 h-4 w-4 text-slate-500" />
                              {booking.seat_number}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Booking Date
                            </p>
                            <p className="mt-2 flex items-center font-semibold text-slate-900">
                              <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                              {formatDate(booking.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <div
                            className={`rounded-2xl border p-4 ${canCancelBooking(booking)
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-slate-200 bg-slate-50'
                              }`}
                          >
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Clock className="h-4 w-4" />
                              Cancellation Window
                            </div>

                            <p className="text-xs text-slate-600">
                              Deadline: {formatDeadlineTime(booking.created_at)}
                            </p>

                            <p
                              className={`mt-2 text-sm font-bold ${remaining.expired ? 'text-red-600' : 'text-blue-600'
                                }`}
                            >
                              {remaining.text}
                            </p>
                          </div>
                        )}

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="space-y-3">
                            <button
                              onClick={() => handleDownloadTicket(booking)}
                              disabled={booking.status === 'cancelled' || downloadingId === booking.id}
                              className="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {downloadingId === booking.id ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  Downloading PDF...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download E-Ticket
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handlePrintTicket(booking)}
                              disabled={booking.status === 'cancelled'}
                              className="flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Print Ticket
                            </button>

                            <button
                              disabled={booking.status === 'cancelled'}
                              className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Email Confirmation
                            </button>

                            {booking.status !== 'cancelled' &&
                              booking.status !== 'completed' &&
                              booking.status !== 'pending_cancellation' &&
                              (canCancelBooking(booking) ? (
                                <button
                                  onClick={() => handleCancelBooking(booking)}
                                  className="flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Booking
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-slate-300 px-4 py-3 font-semibold text-white"
                                  title="Cancellation period expired (2 hours from booking)"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancellation Expired
                                </button>
                              ))}

                            {booking.status === 'pending_cancellation' && (
                              <button
                                disabled
                                className="flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-orange-400 px-4 py-3 font-semibold text-white"
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Cancellation Pending
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;