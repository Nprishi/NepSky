import React, { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  Eye,
  X,
  User,
  Plane,
  CreditCard,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import AdminKeyGate from "./AdminKeyGate";
import { useLanguage } from "../contexts/LanguageContext";

interface BookingData {
  id: string;
  user_id: string | null;
  flight_id: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  seat_number: string;
  booking_reference: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  booking_date: string;
  status: string;
  created_at: string;
  cancelled_by_user?: boolean;
  flight?: {
    id: string;
    flight_number: string;
    airline: string;
    from_location: string;
    to_location: string;
    departure_time: string;
    arrival_time: string;
    price: number;
    aircraft_type: string;
    available_seats: number;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  } | null;
}

const BookingManagement = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    const filtered = bookings.filter(
      (booking) =>
        booking.booking_reference
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.passenger_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.passenger_email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
    setFilteredBookings(filtered);
  }, [searchTerm, bookings]);

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        flight:flights(*),
        user:users(id, full_name, email, phone)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading bookings:", error);
    } else if (data) {
      console.log("Loaded bookings with details:", data);
      setBookings(data as any);
    }
  };

  const handleViewDetails = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: string,
    booking: BookingData,
  ) => {
    // Check if trying to cancel without user request
    if (newStatus === "cancelled" && !booking.cancelled_by_user) {
      alert(
        "Cannot cancel booking! Only user can request cancellation from their side.",
      );
      return;
    }

    // If cancelling with user request, deduct revenue
    if (newStatus === "cancelled" && booking.cancelled_by_user) {
      console.log(
        `Cancelling booking ${booking.booking_reference}. Deducting $${booking.total_amount} from revenue.`,
      );

      // Update payment status to refunded
      await supabase
        .from("payments")
        .update({ status: "refunded" })
        .eq("booking_id", id);
    }

    // Update booking status
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      console.log(
        `Booking ${booking.booking_reference} status updated to ${newStatus}`,
      );
      loadBookings();
      if (showDetailsModal) {
        closeDetailsModal();
      }
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "pending_cancellation":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminKeyGate>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("admin.bookings")}
            </h2>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {t("stats.totalBookings")}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {bookings.length}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`${t("common.search")} bookings by reference, name or email...`}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.reference")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.passenger")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.flight")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.amount")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.paymentStatus")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.bookingStatus")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {booking.booking_reference}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {booking.passenger_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.passenger_email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.passenger_phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.user_id ? (
                        <div>
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Registered
                          </span>
                          {booking.user && (
                            <div className="text-xs text-gray-500 mt-1">
                              {booking.user.full_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Guest
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {booking.flight?.flight_number || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.flight?.from_location} →{" "}
                        {booking.flight?.to_location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.seat_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${Number(booking.total_amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.payment_method || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                          booking.payment_status,
                        )}`}
                      >
                        {booking.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-5 w-5 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {language === "en"
                  ? "No bookings found"
                  : "कुनै बुकिङ फेला परेन"}
              </p>
            </div>
          )}
        </div>

        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Booking Details
                </h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Booking Reference and Status */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Booking Reference</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedBooking.booking_reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Current Status</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getBookingStatusColor(selectedBooking.status)}`}
                      >
                        {selectedBooking.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Passenger Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">
                        {selectedBooking.passenger_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium">
                        {selectedBooking.passenger_email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium">
                        {selectedBooking.passenger_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Seat Number</p>
                      <p className="font-medium text-blue-600">
                        {selectedBooking.seat_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Booking Type</p>
                      {selectedBooking.user_id ? (
                        <div>
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Registered User
                          </span>
                          {selectedBooking.user && (
                            <p className="text-xs text-gray-500 mt-1">
                              Account: {selectedBooking.user.full_name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Guest Booking
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flight Information */}
                {selectedBooking.flight && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Plane className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Flight Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Flight Number</p>
                        <p className="font-medium">
                          {selectedBooking.flight.flight_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Airline</p>
                        <p className="font-medium">
                          {selectedBooking.flight.airline}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Aircraft Type</p>
                        <p className="font-medium">
                          {selectedBooking.flight.aircraft_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Available Seats</p>
                        <p className="font-medium">
                          {selectedBooking.flight.available_seats}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          From
                        </p>
                        <p className="font-semibold text-lg">
                          {selectedBooking.flight.from_location}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {new Date(
                            selectedBooking.flight.departure_time,
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="px-4">
                        <div className="w-16 h-0.5 bg-blue-600"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          To
                        </p>
                        <p className="font-semibold text-lg">
                          {selectedBooking.flight.to_location}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {new Date(
                            selectedBooking.flight.arrival_time,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Payment Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium capitalize">
                        {selectedBooking.payment_method}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedBooking.payment_status)}`}
                      >
                        {selectedBooking.payment_status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-bold text-xl text-green-600">
                        ${Number(selectedBooking.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Booking Date</p>
                      <p className="font-medium">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(
                          selectedBooking.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Update Section */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Update Booking Status
                  </h3>
                  <div className="flex items-center space-x-4">
                    <select
                      value={selectedBooking.status}
                      onChange={(e) =>
                        handleUpdateStatus(
                          selectedBooking.id,
                          e.target.value,
                          selectedBooking,
                        )
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="pending_cancellation" disabled>
                        Pending Cancellation (User Requested)
                      </option>
                      <option
                        value="cancelled"
                        disabled={!selectedBooking.cancelled_by_user}
                      >
                        Cancelled{" "}
                        {!selectedBooking.cancelled_by_user &&
                          "(User must request)"}
                      </option>
                    </select>
                  </div>
                  {!selectedBooking.cancelled_by_user &&
                    selectedBooking.status !== "pending_cancellation" && (
                      <p className="mt-2 text-sm text-yellow-700">
                        ⚠️ Cancellation can only be processed if the user
                        requests it from their side.
                      </p>
                    )}
                  {selectedBooking.status === "pending_cancellation" && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-semibold text-red-800 mb-2">
                        🔴 User has requested cancellation
                      </p>
                      <p className="text-sm text-red-700 mb-3">
                        Select "Cancelled" to approve this request. This will:
                      </p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1 mb-3">
                        <li>Mark the booking as cancelled</li>
                        <li>Update payment status to "refunded"</li>
                        <li>
                          Deduct $
                          {Number(selectedBooking.total_amount).toFixed(2)} from
                          total revenue
                        </li>
                        <li>Free up seat: {selectedBooking.seat_number}</li>
                      </ul>
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            selectedBooking.id,
                            "cancelled",
                            selectedBooking,
                          )
                        }
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                      >
                        Approve Cancellation & Process Refund
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t px-6 py-4 flex justify-end">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminKeyGate>
  );
};

export default BookingManagement;
