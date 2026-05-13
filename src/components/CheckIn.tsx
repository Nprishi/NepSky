import React, { useMemo, useState } from 'react';
import {
  Search,
  Plane,
  CheckCircle,
  AlertCircle,
  Download,
  User,
  Mail,
  CreditCard,
  MapPin,
  Ticket,
  Building2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from '../types';
import { mockFlights } from '../data/mockData';

type SearchType =
  | 'ticketNumber'
  | 'passportNumber'
  | 'email'
  | 'airlineName'
  | 'source'
  | 'destination';

const CheckIn: React.FC = () => {
  const { user } = useAuth();

  const [searchType, setSearchType] = useState<SearchType>('ticketNumber');
  const [searchValue, setSearchValue] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedInPassengers, setCheckedInPassengers] = useState<string[]>([]);

  const searchOptions = useMemo(
    () => [
      {
        value: 'ticketNumber' as SearchType,
        label: 'Ticket Number',
        placeholder: 'Enter ticket number / PNR / booking ID',
        icon: Ticket,
      },
      {
        value: 'passportNumber' as SearchType,
        label: 'Passport Number',
        placeholder: 'Enter passport number',
        icon: CreditCard,
      },
      {
        value: 'email' as SearchType,
        label: 'Email',
        placeholder: 'Enter passenger email',
        icon: Mail,
      },
      {
        value: 'airlineName' as SearchType,
        label: 'Airline Name',
        placeholder: 'Enter airline name',
        icon: Building2,
      },
      {
        value: 'source' as SearchType,
        label: 'Source',
        placeholder: 'Enter source / departure city or airport',
        icon: MapPin,
      },
      {
        value: 'destination' as SearchType,
        label: 'Destination',
        placeholder: 'Enter destination / arrival city or airport',
        icon: Plane,
      },
    ],
    []
  );

  const selectedSearchOption = searchOptions.find((item) => item.value === searchType);

  const normalize = (value: string | undefined | null) =>
    (value || '').toString().trim().toLowerCase();

  const includesText = (field: string | undefined | null, value: string) =>
    normalize(field).includes(normalize(value));

  const getBookingsFromStorage = (): Booking[] => {
    try {
      return JSON.parse(localStorage.getItem('bookings') || '[]');
    } catch {
      return [];
    }
  };

  const getFlightByBooking = (bookingItem: Booking) => {
    return mockFlights.find((f) => f.id === bookingItem.flightId);
  };

  const handleSearch = async () => {
    const trimmedValue = searchValue.trim();

    if (!trimmedValue) {
      setError(`Please enter a valid ${selectedSearchOption?.label || 'search value'}`);
      return;
    }

    setIsLoading(true);
    setError('');
    setBooking(null);
    setCheckedInPassengers([]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const allBookings = getBookingsFromStorage();
      let foundBooking: Booking | null = null;

      foundBooking =
        allBookings.find((b: Booking) => {
          const flight = getFlightByBooking(b);

          switch (searchType) {
            case 'ticketNumber': {
              const ticketNumber = (b as any).ticketNumber;
              return (
                normalize(ticketNumber) === normalize(trimmedValue) ||
                normalize(b.pnr) === normalize(trimmedValue) ||
                normalize((b as any).id) === normalize(trimmedValue)
              );
            }

            case 'passportNumber':
              return b.passengers?.some((p: any) =>
                normalize(p.passportNumber) === normalize(trimmedValue)
              );

            case 'email':
              return b.passengers?.some((p: any) =>
                normalize(p.email) === normalize(trimmedValue)
              );

            case 'airlineName':
              return includesText(flight?.airline, trimmedValue);

            case 'source':
              return includesText(flight?.from, trimmedValue);

            case 'destination':
              return includesText(flight?.to, trimmedValue);

            default:
              return false;
          }
        }) || null;

      if (foundBooking) {
        setBooking(foundBooking);

        const checkedIn = JSON.parse(
          localStorage.getItem(`checkin_${foundBooking.id}`) || '[]'
        );
        setCheckedInPassengers(checkedIn);
      } else {
        setError('No booking found with the provided information');
      }
    } catch (err) {
      setError('Failed to search for booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = (passengerId: string) => {
    if (!booking) return;

    const newCheckedIn = [...checkedInPassengers, passengerId];
    setCheckedInPassengers(newCheckedIn);
    localStorage.setItem(`checkin_${booking.id}`, JSON.stringify(newCheckedIn));
  };

  const handleCheckInAll = () => {
    if (!booking) return;

    const allPassengerIds = booking.passengers.map((p) => p.id);
    setCheckedInPassengers(allPassengerIds);
    localStorage.setItem(`checkin_${booking.id}`, JSON.stringify(allPassengerIds));
  };

  const generateBoardingPass = (passengerId: string) => {
    if (!booking) return;

    const passenger = booking.passengers.find((p) => p.id === passengerId);
    const flight = mockFlights.find((f) => f.id === booking.flightId);
    const seatIndex = booking.passengers.findIndex((p) => p.id === passengerId);
    const seat = booking.seats?.[seatIndex];

    if (!passenger || !flight) return;

    const boardingPassWindow = window.open('', '_blank', 'width=900,height=700');
    if (!boardingPassWindow) {
      alert('Please allow popups to open the boarding pass.');
      return;
    }

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

    const boardingPassHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Boarding Pass - ${passenger.firstName} ${passenger.lastName}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            background: #eef2ff;
            color: #111827;
          }
          .wrapper {
            max-width: 760px;
            margin: 0 auto;
          }
          .card {
            background: #fff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 16px 40px rgba(0,0,0,0.12);
            border: 1px solid #e5e7eb;
          }
          .header {
            background: linear-gradient(135deg, #1d4ed8, #0f172a);
            color: white;
            padding: 24px;
          }
          .header h1 {
            margin: 0 0 6px;
            font-size: 28px;
          }
          .header p {
            margin: 0;
            opacity: 0.9;
          }
          .content {
            padding: 24px;
          }
          .route {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 16px;
            align-items: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 16px;
            margin-bottom: 24px;
          }
          .airport {
            text-align: center;
          }
          .airport-code {
            font-size: 34px;
            font-weight: 800;
            color: #1d4ed8;
          }
          .airport-name {
            font-size: 14px;
            color: #64748b;
            margin-top: 6px;
          }
          .time {
            margin-top: 10px;
            font-size: 18px;
            font-weight: 700;
          }
          .path {
            text-align: center;
            color: #64748b;
            font-size: 14px;
          }
          .details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .detail {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 14px;
          }
          .label {
            font-size: 12px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 6px;
          }
          .value {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            word-break: break-word;
          }
          .barcode {
            height: 62px;
            border-radius: 8px;
            background: repeating-linear-gradient(
              90deg,
              #111 0px,
              #111 2px,
              #fff 2px,
              #fff 4px
            );
            margin-top: 20px;
          }
          .barcode-text {
            text-align: center;
            margin-top: 10px;
            font-family: monospace;
            letter-spacing: 3px;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            padding: 20px 24px 26px;
            color: #64748b;
            font-size: 14px;
          }
          .actions {
            text-align: center;
            margin-top: 18px;
          }
          .btn {
            border: none;
            border-radius: 10px;
            padding: 12px 20px;
            font-weight: 700;
            cursor: pointer;
            margin: 0 8px;
          }
          .btn-primary {
            background: #1d4ed8;
            color: white;
          }
          .btn-secondary {
            background: #475569;
            color: white;
          }
          @media print {
            body { background: white; padding: 0; }
            .actions { display: none; }
            .card { box-shadow: none; border: 1px solid #d1d5db; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <h1>${flight.airline}</h1>
              <p>Boarding Pass</p>
            </div>

            <div class="content">
              <div class="route">
                <div class="airport">
                  <div class="airport-code">${flight.from.split('(')[1]?.replace(')', '') || 'SRC'}</div>
                  <div class="airport-name">${flight.from.split('(')[0]?.trim() || flight.from}</div>
                  <div class="time">${formatTime(flight.departureTime)}</div>
                  <div>${formatDate(flight.departureTime)}</div>
                </div>

                <div class="path">
                  <div><strong>${flight.flightNumber}</strong></div>
                  <div>${flight.duration}</div>
                  <div style="margin-top: 8px;">✈</div>
                </div>

                <div class="airport">
                  <div class="airport-code">${flight.to.split('(')[1]?.replace(')', '') || 'DST'}</div>
                  <div class="airport-name">${flight.to.split('(')[0]?.trim() || flight.to}</div>
                  <div class="time">${formatTime(flight.arrivalTime)}</div>
                  <div>${formatDate(flight.arrivalTime)}</div>
                </div>
              </div>

              <div class="details">
                <div class="detail">
                  <div class="label">Passenger</div>
                  <div class="value">${passenger.firstName} ${passenger.lastName}</div>
                </div>
                <div class="detail">
                  <div class="label">Seat</div>
                  <div class="value">${seat || 'TBA'}</div>
                </div>
                <div class="detail">
                  <div class="label">Class</div>
                  <div class="value">${flight.class}</div>
                </div>
                <div class="detail">
                  <div class="label">Ticket Number</div>
                  <div class="value">${(booking as any).ticketNumber || booking.pnr || booking.id}</div>
                </div>
                <div class="detail">
                  <div class="label">Passport No.</div>
                  <div class="value">${passenger.passportNumber || 'N/A'}</div>
                </div>
                <div class="detail">
                  <div class="label">Boarding Time</div>
                  <div class="value">${formatTime(
                    new Date(new Date(flight.departureTime).getTime() - 30 * 60000).toISOString()
                  )}</div>
                </div>
              </div>

              <div class="barcode"></div>
              <div class="barcode-text">${booking.pnr}${passenger.id}</div>
            </div>

            <div class="footer">
              Please arrive at the airport at least 2 hours before international departure.
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-primary" onclick="window.print()">Print Boarding Pass</button>
            <button class="btn btn-secondary" onclick="window.close()">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;

    boardingPassWindow.document.write(boardingPassHTML);
    boardingPassWindow.document.close();
  };

  const getFlightDetails = () => {
    if (!booking) return null;
    return mockFlights.find((f) => f.id === booking.flightId);
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const flight = getFlightDetails();
  const SelectedIcon = selectedSearchOption?.icon || Search;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-4 py-1 text-sm font-medium mb-3">
            Online Check-in
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Find Your Booking
          </h1>
          <p className="text-gray-600">
            Search by ticket number, passport number, airline name, email, source, or destination.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8">
          <h2 className="text-xl font-semibold mb-5">Search Booking</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search By
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as SearchType)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {searchOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Value
              </label>
              <div className="relative">
                <SelectedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder={selectedSearchOption?.placeholder}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center font-medium"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </div>

        {booking && flight && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-slate-900 text-white p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Flight Details</h2>
                  <p className="text-blue-100">
                    Ticket: {(booking as any).ticketNumber || booking.pnr || booking.id}
                  </p>
                  <p className="text-blue-100">PNR: {booking.pnr}</p>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-blue-100">Status</p>
                  <p className="text-xl font-bold">Confirmed</p>
                  <p className="text-sm text-blue-200">{flight.airline}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatTime(flight.departureTime)}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {formatDate(flight.departureTime)}
                    </div>
                    <div className="font-medium">{flight.from}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <div className="px-3 text-sm text-gray-500 flex items-center">
                        <Plane className="h-4 w-4 mr-1" />
                        {flight.duration}
                      </div>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                    <div className="text-sm font-medium">{flight.flightNumber}</div>
                    <div className="text-xs text-gray-500">{flight.aircraft}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatTime(flight.arrivalTime)}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {formatDate(flight.arrivalTime)}
                    </div>
                    <div className="font-medium">{flight.to}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold">Passengers</h3>
                  {checkedInPassengers.length < booking.passengers.length && (
                    <button
                      onClick={handleCheckInAll}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Check-in All
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {booking.passengers.map((passenger: any, index: number) => {
                    const isCheckedIn = checkedInPassengers.includes(passenger.id);

                    return (
                      <div
                        key={passenger.id}
                        className="border border-gray-200 rounded-2xl p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 text-blue-700" />
                              </div>

                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-base">
                                  {passenger.firstName} {passenger.lastName}
                                </p>
                                <div className="mt-1 space-y-1 text-sm text-gray-500">
                                  <p>Email: {passenger.email || 'N/A'}</p>
                                  <p>Passport: {passenger.passportNumber || 'N/A'}</p>
                                  <p>Seat: {booking.seats?.[index] || 'Not assigned'}</p>
                                </div>
                              </div>

                              {isCheckedIn && (
                                <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                  <CheckCircle className="h-5 w-5 mr-1" />
                                  <span className="text-sm font-medium">Checked In</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {!isCheckedIn ? (
                              <button
                                onClick={() => handleCheckIn(passenger.id)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Check In
                              </button>
                            ) : (
                              <button
                                onClick={() => generateBoardingPass(passenger.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Boarding Pass
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {checkedInPassengers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">
                        Check-in Complete ({checkedInPassengers.length}/{booking.passengers.length}{' '}
                        passengers)
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Please arrive at the airport at least 2 hours before departure for
                        international flights.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;