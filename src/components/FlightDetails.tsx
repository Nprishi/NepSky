import React from 'react';
import CurrencyDisplay from './CurrencyDisplay';
import { Plane, MapPin, Clock, Users, ArrowRight, ArrowLeft } from 'lucide-react';

interface FlightDetailsProps {
  flight: {
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
  };
  onNext: () => void;
  onBack: () => void;
}

const FlightDetails: React.FC<FlightDetailsProps> = ({ flight, onNext, onBack }) => {
  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 max-w-4xl mx-auto my-6 md:my-12">
      {/* Top header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Flight Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review your selected flight before continuing
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="flex items-center p-4 bg-primary-50 rounded-xl shadow-sm border border-primary-100">
          <Plane className="h-6 w-6 text-primary-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-primary-700">Flight Number</p>
            <p className="text-lg font-semibold text-gray-800">{flight.flightNumber}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-primary-50 rounded-xl shadow-sm border border-primary-100">
          <img
            src={`https://www.google.com/s2/favicons?domain=${flight.airline.replace(/\s/g, '').toLowerCase()}.com&sz=32`}
            alt={`${flight.airline} logo`}
            className="h-6 w-6 mr-4"
          />
          <div>
            <p className="text-sm font-medium text-primary-700">Airline</p>
            <p className="text-lg font-semibold text-gray-800">{flight.airline}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <MapPin className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Origin</p>
            <p className="text-lg font-semibold text-gray-800">{flight.from}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <MapPin className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Destination</p>
            <p className="text-lg font-semibold text-gray-800">{flight.to}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <Clock className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Departure Time</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Date(flight.departureTime).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <Clock className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Arrival Time</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Date(flight.arrivalTime).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <Clock className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Duration</p>
            <p className="text-lg font-semibold text-gray-800">{flight.duration}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <Users className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Class</p>
            <p className="text-lg font-semibold text-gray-800">{flight.class}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <Plane className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Aircraft</p>
            <p className="text-lg font-semibold text-gray-800">{flight.aircraft}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
          <Users className="h-6 w-6 text-gray-600 mr-4" />
          <div>
            <p className="text-sm font-medium text-gray-500">Available Seats</p>
            <p className="text-lg font-semibold text-gray-800">{flight.availableSeats}</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 md:mt-10">
        <p className="text-2xl md:text-3xl font-bold text-primary-600 mb-6">
          Price:
          <CurrencyDisplay
            amount={flight.price}
            className="text-nepal-600"
          />
        </p>
        <button
          onClick={onNext}
          className="mt-4 w-full md:w-auto bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-200 flex items-center justify-center space-x-3 mx-auto"
        >
          Continue to Passenger Details
          <ArrowRight className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default FlightDetails;