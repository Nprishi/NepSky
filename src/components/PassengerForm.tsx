import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useBooking } from "../contexts/BookingContext";
import { useAuth } from "../contexts/AuthContext";
import { Passenger } from "../types";

interface PassengerFormProps {
  onNext: () => void;
  onBack: () => void;
}

const PassengerForm: React.FC<PassengerFormProps> = ({ onNext, onBack }) => {
  const { searchFilters, passengers, setPassengers } = useBooking();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Passenger[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const flightType = searchFilters?.flightType;

  useEffect(() => {
    if (passengers && passengers.length > 0) {
      setFormData(passengers);
      return;
    }

    if (searchFilters) {
      const initialPassengers: Passenger[] = Array.from(
        { length: searchFilters.passengers },
        (_, index) => ({
          id: `passenger-${index + 1}`,
          title: "Mr",
          firstName: index === 0 && user ? user.firstName || "" : "",
          lastName: index === 0 && user ? user.lastName || "" : "",
          dateOfBirth: "",
          nationality: "",
          passportNumber: "",
          nationalId: "",
          email: index === 0 && user ? user.email || "" : "",
          phone: index === 0 && user ? user.phone || "" : "",
        }),
      );

      setFormData(initialPassengers);
    }
  }, [searchFilters, user, passengers]);

  const handleInputChange = (
    passengerIndex: number,
    field: keyof Passenger,
    value: string,
  ) => {
    const updatedPassengers = [...formData];
    updatedPassengers[passengerIndex] = {
      ...updatedPassengers[passengerIndex],
      [field]: value,
    };

    setFormData(updatedPassengers);
    setPassengers(updatedPassengers);

    const errorKey = `${passengerIndex}-${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    formData.forEach((passenger, index) => {
      // FIRST NAME

      const firstName = passenger.firstName.trim();
      if (!firstName) {
        newErrors[`${index}-firstName`] = "First name is required";
      } else if (firstName.length < 2) {
        newErrors[`${index}-firstName`] = "Too short";
      } else if (!/^[A-Za-z\s'-]+$/.test(firstName)) {
        newErrors[`${index}-firstName`] = "Only letters allowed";
      }

      // LAST NAME

      const lastName = passenger.lastName.trim();
      if (!lastName) {
        newErrors[`${index}-lastName`] = "Last name is required";
      } else if (lastName.length < 2) {
        newErrors[`${index}-lastName`] = "Too short";
      } else if (!/^[A-Za-z\s'-]+$/.test(lastName)) {
        newErrors[`${index}-lastName`] = "Only letters allowed";
      }

      // DATE OF BIRTH (AGE >= 16)

      if (!passenger.dateOfBirth) {
        newErrors[`${index}-dateOfBirth`] = "Date of birth is required";
      } else {
        const dob = new Date(passenger.dateOfBirth);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }

        if (age < 16) {
          newErrors[`${index}-dateOfBirth`] =
            "Passenger must be at least 16 years old";
        }
      }

      // NATIONALITY

      const nationality = passenger.nationality.trim();
      if (!nationality) {
        newErrors[`${index}-nationality`] = "Nationality is required";
      }

      // PASSPORT NUMBER / NATIONAL ID (conditional requirements)

      const passport = (passenger.passportNumber || "").trim();
      const nationalId = (passenger.nationalId || "").trim();

      // Flight type may be provided in searchFilters (Domestic | International)
      const flightType = searchFilters?.flightType;

      if (flightType === "International") {
        // Passport required for international flights
        if (!passport) {
          newErrors[`${index}-passportNumber`] = "Passport number is required";
        } else if (passport.length < 6) {
          newErrors[`${index}-passportNumber`] = "Too short";
        } else if (passport.length > 9) {
          newErrors[`${index}-passportNumber`] = "Too long";
        } else if (!/^[A-Za-z0-9]+$/.test(passport)) {
          newErrors[`${index}-passportNumber`] =
            "Only letters and numbers allowed";
        }
      } else {
        // Domestic (or unknown) => National ID / Citizenship required, passport optional
        if (!nationalId) {
          newErrors[`${index}-nationalId`] =
            "Citizenship / National ID is required for domestic flights";
        } else if (nationalId.length < 3) {
          newErrors[`${index}-nationalId`] = "Too short";
        }
        // Passport can be present but is optional for domestic
        if (passport) {
          if (passport.length < 6) {
            newErrors[`${index}-passportNumber`] = "Too short";
          } else if (passport.length > 9) {
            newErrors[`${index}-passportNumber`] = "Too long";
          } else if (!/^[A-Za-z0-9]+$/.test(passport)) {
            newErrors[`${index}-passportNumber`] =
              "Only letters and numbers allowed";
          }
        }
      }
      // EMAIL
      const email = passenger.email.trim();
      if (!email) {
        newErrors[`${index}-email`] = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors[`${index}-email`] = "Invalid email";
      }

      // PHONE (NEPAL FORMAT)

      let phone = passenger.phone.replace(/[\s-]/g, "");

      if (!phone) {
        newErrors[`${index}-phone`] = "Phone number is required";
      } else if (!/^(?:\+977|977)?9[78]\d{8}$/.test(phone)) {
        newErrors[`${index}-phone`] = "Enter valid number (+97798XXXXXXXX)";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setPassengers(formData);
    onNext();
  };

  const countries = [
    "Nepal",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "South Korea",
    "Singapore",
    "India",
    "China",
    "Thailand",
    "Malaysia",
    "UAE",
  ];

  if (!searchFilters && (!passengers || passengers.length === 0)) {
    return (
      <div className="p-6 sm:p-8 text-center">
        <p className="text-gray-600">
          No passenger setup found. Please select a flight first.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Passenger Information
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Please provide details for all passengers
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

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {formData.map((passenger, index) => (
          <div
            key={passenger.id}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Passenger {index + 1} {index === 0 && "(Primary Contact)"}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <select
                  value={passenger.title}
                  onChange={(e) =>
                    handleInputChange(index, "title", e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>

              {/* First Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={passenger.firstName}
                    onChange={(e) =>
                      handleInputChange(index, "firstName", e.target.value)
                    }
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors[`${index}-firstName`]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="First name"
                  />
                </div>
                {errors[`${index}-firstName`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`${index}-firstName`]}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={passenger.lastName}
                    onChange={(e) =>
                      handleInputChange(index, "lastName", e.target.value)
                    }
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors[`${index}-lastName`]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Last name"
                  />
                </div>
                {errors[`${index}-lastName`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`${index}-lastName`]}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />

                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                    value={passenger.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange(index, "dateOfBirth", e.target.value)
                    }
                    min={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() - 120),
                      )
                        .toISOString()
                        .split("T")[0]
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {errors[`${index}-dateOfBirth`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`${index}-dateOfBirth`]}
                  </p>
                )}
              </div>
              {/* Nationality */}

              <div className="relative">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nationality
                  </label>
                </div>
                <MapPin className="absolute left-3 top-10 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search country..."
                  value={passenger.nationality}
                  onChange={(e) =>
                    handleInputChange(index, "nationality", e.target.value)
                  }
                  list={`countries-${index}`} // Uses a native datalist for simple autocomplete
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors[`${index}-nationality`]
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                <datalist id={`countries-${index}`}>
                  {countries.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </div>

              {/* Passport Number */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Passport Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={passenger.passport}
                    onChange={(e) =>
                      handleInputChange(index, "passport", e.target.value)
                    }
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors[`${index}-passportNumber`]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Passport number"
                  />
                </div>
                {errors[`${index}-passportNumber`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`${index}-passportNumber`]}
                  </p>
                )}
              </div>

              {/* Citizenship / National ID */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Citizenship / National ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={passenger["national-id"] || ""}
                    onChange={(e) =>
                      handleInputChange(index, "national-id", e.target.value)
                    }
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors[`${index}-nationalId`]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Citizenship or national ID number"
                  />
                </div>
                {errors[`${index}-nationalId`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`${index}-nationalId`]}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {flightType === "international"
                    ? "Passport required for international flights. National ID is optional."
                    : "National ID required for domestic flights. Passport is optional."}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={passenger.email}
                    onChange={(e) =>
                      handleInputChange(index, "email", e.target.value)
                    }
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors[`${index}-email`]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Email address"
                  />
                </div>
                {errors[`${index}-email`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`${index}-email`]}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel" // Changed to 'tel' for better mobile keyboard support
                    value={passenger.phone}
                    onChange={(e) => {
                      // Sanitize: allow only numbers, plus sign, and hyphens
                      const sanitizedValue = e.target.value.replace(
                        /[^\d+-\s]/g,
                        "",
                      );
                      handleInputChange(index, "phone", sanitizedValue);
                    }}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors[`${index}-phone`]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>
                {errors[`${index}-phone`] && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {errors[`${index}-phone`]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700"
          >
            Continue to Seat Selection
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PassengerForm;
