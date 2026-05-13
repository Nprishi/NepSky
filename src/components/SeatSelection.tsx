import React, { useState, useEffect, useMemo } from 'react';
import { Plane, Info, CheckCircle2 } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { supabase } from '../lib/supabase';
import { Seat } from '../types';

interface SeatSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

const SeatSelection: React.FC<SeatSelectionProps> = ({ onNext, onBack }) => {
  const { selectedFlight, passengers, selectedSeats, setSelectedSeats } = useBooking();

  const [seats, setSeats] = useState<Seat[]>([]);
  const [currentSeats, setCurrentSeats] = useState<string[]>(selectedSeats || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedSeats && selectedSeats.length > 0) {
      setCurrentSeats(selectedSeats);
    }
  }, [selectedSeats]);

  useEffect(() => {
    const loadSeatMap = async () => {
      if (!selectedFlight) return;

      setLoading(true);

      try {
        const baseSeats = generateSeatMap(selectedFlight.aircraft, selectedFlight.class);

        const { data: bookedData, error } = await supabase
          .from('booked_seats')
          .select('seat_number')
          .eq('flight_id', selectedFlight.id)
          .eq('status', 'booked');

        if (error) {
          console.error('Error loading booked seats:', error);
          setSeats(baseSeats);
          return;
        }

        const bookedSeatNumbers = new Set(
          (bookedData || []).map((item: any) => item.seat_number)
        );

        const mergedSeats = baseSeats.map((seat) => ({
          ...seat,
          isAvailable:
            !bookedSeatNumbers.has(seat.seatNumber) ||
            currentSeats.includes(seat.seatNumber),
        }));

        setSeats(mergedSeats);
      } catch (error) {
        console.error('Error generating seat map:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSeatMap();
  }, [selectedFlight, currentSeats]);

  const generateSeatMap = (aircraft: string, flightClass: string): Seat[] => {
    const generatedSeats: Seat[] = [];
    let rows = 30;
    let seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (aircraft.includes('777')) {
      rows = 35;
      seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'];
    } else if (aircraft.includes('737')) {
      rows = 25;
      seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F'];
    }

    for (let row = 1; row <= rows; row++) {
      for (const letter of seatsPerRow) {
        const seatNumber = `${row}${letter}`;
        const isWindow = letter === 'A' || letter === 'F' || letter === 'J';
        const isAisle =
          letter === 'C' ||
          letter === 'D' ||
          (seatsPerRow.length > 6 && (letter === 'G' || letter === 'H'));

        const position = isWindow ? 'window' : isAisle ? 'aisle' : 'middle';

        let price = 0;
        if (isWindow) price = 25;
        else if (isAisle) price = 15;

        generatedSeats.push({
          id: seatNumber,
          seatNumber,
          class: flightClass as 'Economy' | 'Business' | 'First',
          isAvailable: true,
          price,
          position,
        });
      }
    }

    return generatedSeats;
  };

  const handleSeatClick = (seatNumber: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    let newSelectedSeats = [...currentSeats];
    const seatIndex = newSelectedSeats.indexOf(seatNumber);

    if (seatIndex > -1) {
      newSelectedSeats.splice(seatIndex, 1);
    } else if (newSelectedSeats.length < passengers.length) {
      newSelectedSeats.push(seatNumber);
    }

    setCurrentSeats(newSelectedSeats);
    setSelectedSeats(newSelectedSeats);
  };

  const getSeatClass = (seat: Seat) => {
    let baseClass =
      'w-9 h-9 sm:w-10 sm:h-10 m-1 rounded-t-xl border text-[11px] sm:text-xs flex items-center justify-center font-semibold transition-all duration-200 ';

    if (!seat.isAvailable) {
      baseClass += 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed ';
    } else if (currentSeats.includes(seat.seatNumber)) {
      baseClass += 'bg-primary-600 border-primary-700 text-white shadow-md scale-105 ';
    } else {
      baseClass +=
        'bg-white border-gray-300 text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 cursor-pointer ';
    }

    return baseClass;
  };

  const calculateTotalSeatFees = () => {
    return currentSeats.reduce((total, seatNumber) => {
      const seat = seats.find((s) => s.seatNumber === seatNumber);
      return total + (seat?.price || 0);
    }, 0);
  };

  const handleContinue = () => {
    setSelectedSeats(currentSeats);
    onNext();
  };

  const seatRows = useMemo(() => {
    return seats.reduce((acc, seat) => {
      const row = parseInt(seat.seatNumber, 10);
      if (!acc[row]) acc[row] = [];
      acc[row].push(seat);
      return acc;
    }, {} as { [key: number]: Seat[] });
  }, [seats]);

  if (!selectedFlight) {
    return <div className="p-6 text-gray-600">No flight selected.</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-gray-900">
          Select Your Seats
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Choose {passengers.length} seat{passengers.length > 1 ? 's' : ''} for your flight.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-600">Loading seat map...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Aircraft: {selectedFlight.aircraft}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Already booked seats are shown as occupied
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-t bg-white border border-gray-300" />
                      <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-t bg-primary-600 border border-primary-700" />
                      <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-t bg-gray-200 border border-gray-300" />
                      <span className="text-gray-600">Occupied</span>
                    </div>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-dashed border-primary-200 bg-primary-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-primary-700">
                    <Plane className="h-4 w-4" />
                    <span className="font-medium">Front of aircraft</span>
                  </div>
                </div>

                <div className="max-h-[520px] overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {Object.entries(seatRows)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([rowNumber, rowSeats]) => (
                        <div key={rowNumber} className="flex items-center">
                          <div className="w-10 text-center text-xs font-semibold text-gray-500">
                            {rowNumber}
                          </div>

                          <div className="flex flex-wrap items-center">
                            {rowSeats
                              .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
                              .map((seat, index) => (
                                <React.Fragment key={seat.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSeatClick(seat.seatNumber, seat.isAvailable)
                                    }
                                    className={getSeatClass(seat)}
                                    disabled={!seat.isAvailable}
                                    title={`Seat ${seat.seatNumber} • ${seat.position} • ${
                                      seat.price > 0 ? `$${seat.price}` : 'Free'
                                    }`}
                                  >
                                    {seat.seatNumber.slice(-1)}
                                  </button>

                                  {rowSeats.length === 6 && index === 2 && (
                                    <div className="w-4 sm:w-6" />
                                  )}
                                  {rowSeats.length === 9 &&
                                    (index === 2 || index === 5) && (
                                      <div className="w-4 sm:w-6" />
                                    )}
                                </React.Fragment>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className="sticky top-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Selection Summary</h3>

                <div className="space-y-3">
                  {passengers.map((passenger, index) => (
                    <div
                      key={passenger.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {passenger.firstName} {passenger.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Passenger {index + 1}</p>
                      </div>

                      <div className="ml-3 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {currentSeats[index] || 'Not selected'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {currentSeats.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="mb-3 font-medium text-gray-900">Seat Fees</h4>
                    <div className="space-y-2 text-sm">
                      {currentSeats.map((seatNumber) => {
                        const seat = seats.find((s) => s.seatNumber === seatNumber);
                        return (
                          <div key={seatNumber} className="flex justify-between text-gray-600">
                            <span>Seat {seatNumber}</span>
                            <span className="font-medium text-gray-900">
                              ${seat?.price || 0}
                            </span>
                          </div>
                        );
                      })}

                      <div className="mt-2 flex justify-between border-t pt-3 text-sm font-semibold text-gray-900">
                        <span>Total Seat Fees</span>
                        <span>${calculateTotalSeatFees()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                    <Info className="h-4 w-4" />
                    Seat pricing
                  </div>
                  <div className="space-y-1 text-sm text-blue-900/80">
                    <p>• Window seats: +$25</p>
                    <p>• Aisle seats: +$15</p>
                    <p>• Middle seats: Free</p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    <span className="font-medium text-gray-700">
                      Selected: {currentSeats.length} of {passengers.length} seats
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back to Passengers
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={currentSeats.length !== passengers.length}
              className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Payment
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SeatSelection;