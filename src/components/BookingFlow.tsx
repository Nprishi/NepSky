import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ShieldAlert,
  Plane,
  Users,
  Armchair,
  CreditCard,
  FileCheck,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import FlightList from './FlightList';
import PassengerForm from './PassengerForm';
import SeatSelection from './SeatSelection';
import PaymentForm from './PaymentForm';
import BookingConfirmation from './BookingConfirmation';
import FlightDetails from './FlightDetails';

const TOTAL_STEPS = 6;

const BookingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [accessError, setAccessError] = useState('');
  const { user } = useAuth();
  const { searchFilters, selectedFlight, setSearchFilters, setSelectedFlight } = useBooking();
  const navigate = useNavigate();


  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {

    // 1. Don't run timer on Confirmation or if there's an Access Error
    if (currentStep >= 6 || accessError) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }

        // Inside your useEffect timer:
        if (prev === 60) {
          Swal.fire({
            title: 'Warning: Session Expiring Soon!',
            text: 'Your session will expire in 60 seconds.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Yes, keep booking',
            cancelButtonText: 'No, cancel',
          }).then((result) => {
            if (result.isConfirmed) {
              setTimeLeft(60); // Reset timer to 1 minute
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              navigate('/');
            }
          });
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, accessError]);

  const handleTimeout = () => {
    Swal.fire({
      title: 'Session Expired!',
      text: 'To keep seat inventory accurate, booking sessions are limited to 10 minutes.',
      icon: 'warning',
      confirmButtonColor: '#2563eb', // Matches your blue-600
      confirmButtonText: 'Ok',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed || result.isDismissed) {
        // Clear data and redirect
        sessionStorage.removeItem('pendingSearch');
        navigate('/');
      }
    });
  };

  // Helper for formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    // Restore pending search if present
    const pendingSearch = sessionStorage.getItem('pendingSearch');
    if (pendingSearch && !searchFilters) {
      try {
        const filters = JSON.parse(pendingSearch);
        setSearchFilters(filters);
      } catch (error) {
        console.error('Failed to parse pending search:', error);
      } finally {
        sessionStorage.removeItem('pendingSearch');
      }
    }

    // Restore pending selected flight (after login)
    const pendingSelected = sessionStorage.getItem('pendingSelectedFlight');
    if (pendingSelected && !selectedFlight) {
      try {
        const flight = JSON.parse(pendingSelected);
        setSelectedFlight(flight);
        setCurrentStep(2);
      } catch (error) {
        console.error('Failed to parse pending selected flight:', error);
      } finally {
        sessionStorage.removeItem('pendingSelectedFlight');
      }
    }

    // If user is present, validate account status and set access errors
    if (!user) return;

    const userStatus = (user as any)?.status?.toLowerCase?.() || 'active';

    if (userStatus === 'blocked') {
      setAccessError('Your account has been blocked by admin. You cannot access booking services.');
      return;
    }

    if (userStatus === 'suspended') {
      setAccessError('Your account is currently suspended. You cannot make a booking right now.');
      return;
    }

    setAccessError('');
  }, [user, navigate, searchFilters, selectedFlight, setSearchFilters, setSelectedFlight]);

  const steps = useMemo(
    () => [
      { id: 1, label: 'Select Flight', short: 'Flight', icon: Plane },
      { id: 2, label: 'Flight Details', short: 'Details', icon: Info },
      { id: 3, label: 'Passenger Details', short: 'Passengers', icon: Users },
      { id: 4, label: 'Select Seats', short: 'Seats', icon: Armchair },
      { id: 5, label: 'Payment', short: 'Payment', icon: CreditCard },
      { id: 6, label: 'Confirmation', short: 'Confirmation', icon: FileCheck },
    ],
    []
  );

  const nextStep = () => {
    if (accessError) return;
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const onBack = () => {
    if (currentStep === 1) {
      navigate('/flight');
      return;
    }

    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Select Flight';
      case 2:
        return 'Flight Details';
      case 3:
        return 'Passenger Details';
      case 4:
        return 'Select Seats';
      case 5:
        return 'Payment';
      case 6:
        return 'Confirmation';
      default:
        return 'Booking';
    }
  };

  const renderStep = () => {
    if (accessError) return null;

    switch (currentStep) {
      case 1:
        return <FlightList onNext={nextStep} onBack={onBack} />;

      case 2:
        return selectedFlight ? (
          <FlightDetails
            flight={selectedFlight}
            onNext={nextStep}
            onBack={onBack}
          />
        ) : (
          <FlightList onNext={nextStep} onBack={onBack} />
        );

      case 3:
        return <PassengerForm onNext={nextStep} onBack={onBack} />;

      case 4:
        return <SeatSelection onNext={nextStep} onBack={onBack} />;

      case 5:
        return <PaymentForm onNext={nextStep} onBack={onBack} />;

      case 6:
        return <BookingConfirmation />;

      default:
        return <FlightList onNext={nextStep} onBack={onBack} />;
    }
  };

  

  const userStatus = (user as any)?.status?.toLowerCase?.() || 'active';
  const progressWidth = `${(currentStep / TOTAL_STEPS) * 100}%`;

  if (accessError) {
    const isBlocked = userStatus === 'blocked';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/flight')}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-red-600 to-rose-500 p-1" />
            <div className="p-8 sm:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                {isBlocked ? (
                  <Ban className="h-10 w-10 text-red-600" />
                ) : (
                  <ShieldAlert className="h-10 w-10 text-amber-600" />
                )}
              </div>

              <div className="mt-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {isBlocked ? 'Account Blocked' : 'Account Suspended'}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  {accessError}
                </p>
              </div>


              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-slate-900">Current Status</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Your account status is currently set to{' '}
                    <span className="font-semibold capitalize text-slate-900">{userStatus}</span>.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h3 className="font-semibold text-slate-900">What to do next</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Please contact support or wait for admin approval to restore your booking access.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => navigate('/contact')}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:translate-y-[-1px]"
                >
                  Contact Support
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 p-1" />
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Booking Process
                </div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {getStepTitle()}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Complete your flight booking step by step with a smooth and secure process.
                </p>
              </div>

              <div className="ml-auto">
                <p className="text-xs font-semibold uppercase text-red-800" >Time Left</p>
                <p className="text-sm font-mono font-bold">{formatTime(timeLeft)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Progress
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  Step {currentStep} of {TOTAL_STEPS}
                </p>

              </div>
            </div>


            {/* Progress bar */}
            <div className="mt-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                  style={{ width: progressWidth }}
                />
              </div>

              {/* Desktop steps */}
              <div className="mt-5 hidden grid-cols-6 gap-3 md:grid">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <div
                      key={step.id}
                      className={`rounded-2xl border px-3 py-3 text-center transition ${isActive
                        ? 'border-blue-200 bg-blue-50'
                        : isCompleted
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-white'
                        }`}
                    >
                      <div
                        className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p
                        className={`text-xs font-semibold ${isActive
                          ? 'text-blue-700'
                          : isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                          }`}
                      >
                        {step.short}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Mobile steps */}
              <div className="mt-4 flex flex-wrap gap-2 md:hidden">
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <span
                      key={step.id}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {step.short}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;