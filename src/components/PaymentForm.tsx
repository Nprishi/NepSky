import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Lock,
  Calendar,
  User,
  Smartphone,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Building2,
} from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { PaymentDetails, TotalsSummary } from '../types';
import CurrencyDisplay from './CurrencyDisplay';
import PaymentConfirmation from './PaymentConfirmation';

interface PaymentFormProps {
  onNext: () => void;
  onBack: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onNext, onBack }) => {
  const {
    selectedFlight,
    passengers,
    selectedSeats,
    paymentDetails,
    setPaymentDetails,
    createBooking,
  } = useBooking();

  const { user } = useAuth();

  const getInitialPaymentData = (): PaymentDetails => ({
    method: paymentDetails?.method || 'credit-card',
    cardNumber: paymentDetails?.cardNumber || '',
    expiryDate: paymentDetails?.expiryDate || '',
    cvv: paymentDetails?.cvv || '',
    cardHolderName:
      paymentDetails?.cardHolderName ||
      (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''),
    esewaId: paymentDetails?.esewaId || '',
    khaltiNumber: paymentDetails?.khaltiNumber || '',
    mobileNumber: paymentDetails?.mobileNumber || '',
    bankAccount: paymentDetails?.bankAccount || '',
    billingAddress: {
      street: paymentDetails?.billingAddress?.street || '',
      city: paymentDetails?.billingAddress?.city || '',
      state: paymentDetails?.billingAddress?.state || '',
      zipCode: paymentDetails?.billingAddress?.zipCode || '',
      country: paymentDetails?.billingAddress?.country || '',
    },
  });

  const [paymentData, setPaymentDataState] = useState<PaymentDetails>(getInitialPaymentData());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);

  useEffect(() => {
    if (paymentDetails) {
      setPaymentDataState((prev) => ({
        ...prev,
        ...paymentDetails,
        billingAddress: {
          ...prev.billingAddress,
          ...(paymentDetails.billingAddress || {}),
        },
      }));
    }
  }, [paymentDetails]);

  const isNepalPaymentMethod = (method: string) =>
    ['esewa', 'khalti', 'ime-pay', 'mobile-banking'].includes(method);

  const savePaymentState = (updated: PaymentDetails) => {
    setPaymentDataState(updated);
    setPaymentDetails(updated);
  };

  const handleInputChange = (field: string, value: string) => {
    let updated: PaymentDetails;

    if (field.startsWith('billingAddress.')) {
      const addressField = field.split('.')[1];
      updated = {
        ...paymentData,
        billingAddress: {
          ...paymentData.billingAddress,
          [addressField]: value,
        },
      };
    } else {
      updated = {
        ...paymentData,
        [field]: value,
      };
    }

    savePaymentState(updated);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }));
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const validateExpiryDate = (expiry: string) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

    const [monthStr, yearStr] = expiry.split('/');
    const month = Number(monthStr);
    const year = Number(`20${yearStr}`);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const expiryDate = new Date(year, month, 0, 23, 59, 59);
    return expiryDate >= now;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const cardMethod = !isNepalPaymentMethod(paymentData.method);

    if (cardMethod) {
      if (!paymentData.cardHolderName.trim()) {
        newErrors.cardHolderName = 'Cardholder name is required';
      }

      const cleanCard = paymentData.cardNumber.replace(/\s/g, '');
      if (!cleanCard) {
        newErrors.cardNumber = 'Card number is required';
      } else if (cleanCard.length !== 16) {
        newErrors.cardNumber = 'Card number must be 16 digits';
      }

      if (!paymentData.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!validateExpiryDate(paymentData.expiryDate)) {
        newErrors.expiryDate = 'Enter a valid future expiry date';
      }

      if (!paymentData.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
        newErrors.cvv = 'CVV must be 3 or 4 digits';
      }

      if (!paymentData.billingAddress?.street.trim()) {
        newErrors['billingAddress.street'] = 'Street address is required';
      }

      if (!paymentData.billingAddress?.city.trim()) {
        newErrors['billingAddress.city'] = 'City is required';
      }

      if (!paymentData.billingAddress?.zipCode.trim()) {
        newErrors['billingAddress.zipCode'] = 'ZIP / postal code is required';
      }

      if (!paymentData.billingAddress?.country.trim()) {
        newErrors['billingAddress.country'] = 'Country is required';
      }
    }

    if (!selectedFlight) {
      newErrors.general = 'Missing flight information.';
    }

    if (!passengers.length) {
      newErrors.general = 'Missing passenger information.';
    }

    if (selectedSeats.length !== passengers.length) {
      newErrors.general = 'Please select seats for all passengers before payment.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = (): TotalsSummary => {
    if (!selectedFlight) {
      return { subtotal: 0, taxes: 0, serviceFee: 0, total: 0 };
    }

    let subtotal = selectedFlight.price * passengers.length;

    selectedSeats.forEach((seat) => {
      if (seat.includes('A') || seat.includes('F')) subtotal += 25;
      else if (seat.includes('C') || seat.includes('D')) subtotal += 15;
    });

    const taxes = subtotal * 0.12;
    const serviceFee = 29.99;

    return {
      subtotal,
      taxes,
      serviceFee,
      total: subtotal + taxes + serviceFee,
    };
  };

  const totals: TotalsSummary = useMemo(
    () => calculateTotal(),
    [selectedFlight, passengers, selectedSeats]
  );

  const selectedMethodMeta = useMemo(() => {
    switch (paymentData.method) {
      case 'credit-card':
        return {
          title: 'Credit Card',
          subtitle: 'Visa, Mastercard, American Express',
          accent: 'from-slate-900 to-slate-700',
        };
      case 'debit-card':
        return {
          title: 'Debit Card',
          subtitle: 'Direct secure bank card payment',
          accent: 'from-blue-700 to-blue-500',
        };
      case 'esewa':
        return {
          title: 'eSewa',
          subtitle: 'Official secure eSewa checkout',
          accent: 'from-green-700 to-green-500',
        };
      case 'khalti':
        return {
          title: 'Khalti',
          subtitle: 'Official secure Khalti checkout',
          accent: 'from-purple-700 to-purple-500',
        };
      case 'ime-pay':
        return {
          title: 'IME Pay',
          subtitle: 'Quick mobile wallet payment',
          accent: 'from-sky-700 to-sky-500',
        };
      default:
        return {
          title: 'Mobile Banking',
          subtitle: 'Bank app and mobile transfer',
          accent: 'from-orange-700 to-orange-500',
        };
    }
  }, [paymentData.method]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (isNepalPaymentMethod(paymentData.method)) {
      setShowPaymentConfirmation(true);
      return;
    }

    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      savePaymentState(paymentData);

      await new Promise((resolve) => setTimeout(resolve, 700));

      if (!user) {
        setErrors({ general: 'User not logged in. Please log in and try again.' });
        setIsProcessing(false);
        return;
      }

      const booking = await createBooking(user.id);

      if (!booking) {
        setErrors({ general: 'Failed to create booking. Please try again.' });
        setIsProcessing(false);
        return;
      }

      setIsProcessing(false);
      // notify header about completed booking
      try {
        sessionStorage.setItem('bookingCompleted', JSON.stringify({ bookingId: booking.id, pnr: booking.pnr, amount: booking.totalAmount }));
      } catch (e) {}
      try {
        window.dispatchEvent(new CustomEvent('app:bookingCompleted', { detail: { bookingId: booking.id, pnr: booking.pnr, amount: booking.totalAmount } }));
      } catch (e) {}
      onNext();
    } catch (error) {
      console.error('Payment processing error:', error);
      setErrors({ general: 'Payment processing failed. Please try again.' });
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      savePaymentState(paymentData);

      if (!user) {
        setErrors({ general: 'User not logged in. Please log in and try again.' });
        return;
      }

      const booking = await createBooking(user.id);

      if (!booking) {
        setErrors({ general: 'Failed to create booking. Please try again.' });
        return;
      }

      try {
        sessionStorage.setItem('bookingCompleted', JSON.stringify({ bookingId: booking.id, pnr: booking.pnr, amount: booking.totalAmount }));
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent('app:bookingCompleted', { detail: { bookingId: booking.id, pnr: booking.pnr, amount: booking.totalAmount } }));
      } catch (e) {}

      onNext();
    } catch (error) {
      console.error('Payment success handler error:', error);
      setErrors({ general: 'Failed to complete booking. Please try again.' });
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentConfirmation(false);
  };

  if (!selectedFlight || !user) {
    return <div className="p-6 text-gray-600">Missing booking information</div>;
  }

  if (showPaymentConfirmation) {
    const bookingData = {
      orderId: `ORD${Date.now()}`,
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      customerEmail: user.email || '',
      customerPhone: user.phone || '',
    };

    return (
      <PaymentConfirmation
        paymentMethod={paymentData.method}
        amount={totals.total}
        bookingData={bookingData}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  const paymentMethods = [
    {
      value: 'credit-card',
      label: 'Credit Card',
      desc: 'Global card checkout',
      icon: CreditCard,
      activeClass: 'border-slate-800 bg-slate-50 shadow-sm',
      idleClass: 'border-gray-200 hover:border-slate-300 hover:bg-gray-50',
      iconClass: 'text-slate-700',
      textClass: 'text-slate-800',
    },
    {
      value: 'debit-card',
      label: 'Debit Card',
      desc: 'Direct bank card payment',
      icon: CreditCard,
      activeClass: 'border-blue-600 bg-blue-50 shadow-sm',
      idleClass: 'border-gray-200 hover:border-blue-300 hover:bg-blue-50',
      iconClass: 'text-blue-600',
      textClass: 'text-blue-700',
    },
    {
      value: 'esewa',
      label: 'eSewa',
      desc: 'Popular wallet in Nepal',
      icon: Wallet,
      activeClass: 'border-green-600 bg-green-50 shadow-sm',
      idleClass: 'border-gray-200 hover:border-green-300 hover:bg-green-50',
      iconClass: 'text-green-600',
      textClass: 'text-green-700',
    },
    {
      value: 'khalti',
      label: 'Khalti',
      desc: 'Fast digital wallet',
      icon: Wallet,
      activeClass: 'border-purple-600 bg-purple-50 shadow-sm',
      idleClass: 'border-gray-200 hover:border-purple-300 hover:bg-purple-50',
      iconClass: 'text-purple-600',
      textClass: 'text-purple-700',
    },
    {
      value: 'ime-pay',
      label: 'IME Pay',
      desc: 'Mobile wallet checkout',
      icon: Smartphone,
      activeClass: 'border-sky-600 bg-sky-50 shadow-sm',
      idleClass: 'border-gray-200 hover:border-sky-300 hover:bg-sky-50',
      iconClass: 'text-sky-600',
      textClass: 'text-sky-700',
    },
    {
      value: 'mobile-banking',
      label: 'Mobile Banking',
      desc: 'Bank app transfer',
      icon: Smartphone,
      activeClass: 'border-orange-600 bg-orange-50 shadow-sm',
      idleClass: 'border-gray-200 hover:border-orange-300 hover:bg-orange-50',
      iconClass: 'text-orange-600',
      textClass: 'text-orange-700',
    },
  ];

  const inputBaseClass =
    'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-4 focus:ring-primary-100';
  const errorClass = 'border-red-300 focus:border-red-400';
  const normalClass = 'border-gray-300 focus:border-primary-500';

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Payment Information
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Complete your booking with secure payment and real-time confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          256-bit SSL secure checkout
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose your preferred payment option.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const active = paymentData.method === method.value;

                  return (
                    <label
                      key={method.value}
                      className={`group relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 ${active ? method.activeClass : method.idleClass
                        }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={active}
                        onChange={(e) => handleInputChange('method', e.target.value)}
                        className="sr-only"
                      />

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-white shadow-sm' : 'bg-gray-100'
                              }`}
                          >
                            <Icon className={`h-5 w-5 ${method.iconClass}`} />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className={`font-semibold ${method.textClass}`}>
                            {method.label}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">{method.desc}</div>
                        </div>

                        <div
                          className={`mt-1 h-4 w-4 rounded-full border-2 ${active
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-gray-300 bg-white'
                            }`}
                        >
                          {active && (
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={`overflow-hidden rounded-3xl bg-gradient-to-r ${selectedMethodMeta.accent} p-[1px] shadow-sm`}>
              <div className="rounded-[calc(1.5rem-1px)] bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMethodMeta.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{selectedMethodMeta.subtitle}</p>
                  </div>
                  <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Protected
                  </div>
                </div>

                {!isNepalPaymentMethod(paymentData.method) ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Lock className="h-4 w-4" />
                        Card Information
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Cardholder Name
                          </label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={paymentData.cardHolderName}
                              onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
                              className={`${inputBaseClass} pl-11 ${errors.cardHolderName ? errorClass : normalClass}`}
                              placeholder="Name on card"
                            />
                          </div>
                          {errors.cardHolderName && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.cardHolderName}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Card Number
                          </label>
                          <div className="relative">
                            <CreditCard className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={paymentData.cardNumber}
                              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                              maxLength={19}
                              className={`${inputBaseClass} pl-11 ${errors.cardNumber ? errorClass : normalClass}`}
                              placeholder="1234 5678 9012 3456"
                            />
                          </div>
                          {errors.cardNumber && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.cardNumber}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Expiry Date
                          </label>
                          <div className="relative">
                            <Calendar className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={paymentData.expiryDate}
                              onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                              maxLength={5}
                              className={`${inputBaseClass} pl-11 ${errors.expiryDate ? errorClass : normalClass}`}
                              placeholder="MM/YY"
                            />
                          </div>
                          {errors.expiryDate && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.expiryDate}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            CVV
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            value={paymentData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                            maxLength={4}
                            className={`${inputBaseClass} ${errors.cvv ? errorClass : normalClass}`}
                            placeholder="123"
                          />
                          {errors.cvv && (
                            <p className="mt-1.5 text-sm text-red-600">{errors.cvv}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <MapPin className="h-4 w-4" />
                        Billing Address
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={paymentData.billingAddress.street}
                            onChange={(e) => handleInputChange('billingAddress.street', e.target.value)}
                            className={`${inputBaseClass} ${errors['billingAddress.street'] ? errorClass : normalClass}`}
                            placeholder="123 Main Street"
                          />
                          {errors['billingAddress.street'] && (
                            <p className="mt-1.5 text-sm text-red-600">{errors['billingAddress.street']}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <input
                            type="text"
                            value={paymentData.billingAddress.city}
                            onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                            className={`${inputBaseClass} ${errors['billingAddress.city'] ? errorClass : normalClass}`}
                            placeholder="City"
                          />
                          {errors['billingAddress.city'] && (
                            <p className="mt-1.5 text-sm text-red-600">{errors['billingAddress.city']}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            State / Province
                          </label>
                          <input
                            type="text"
                            value={paymentData.billingAddress.state}
                            onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                            className={`${inputBaseClass} ${normalClass}`}
                            placeholder="State / Province"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            ZIP / Postal Code
                          </label>
                          <input
                            type="text"
                            value={paymentData.billingAddress.zipCode}
                            onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                            className={`${inputBaseClass} ${errors['billingAddress.zipCode'] ? errorClass : normalClass}`}
                            placeholder="12345"
                          />
                          {errors['billingAddress.zipCode'] && (
                            <p className="mt-1.5 text-sm text-red-600">{errors['billingAddress.zipCode']}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Country
                          </label>
                          <select
                            value={paymentData.billingAddress.country}
                            onChange={(e) => handleInputChange('billingAddress.country', e.target.value)}
                            className={`${inputBaseClass} ${errors['billingAddress.country'] ? errorClass : normalClass}`}
                          >
                            <option value="">Select country</option>
                            <option value="NP">Nepal</option>
                            <option value="IN">India</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="UK">United Kingdom</option>
                            <option value="AU">Australia</option>
                          </select>
                          {errors['billingAddress.country'] && (
                            <p className="mt-1.5 text-sm text-red-600">{errors['billingAddress.country']}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-blue-800">
                      <Building2 className="h-5 w-5" />
                      <span className="font-semibold">Official payment redirect</span>
                    </div>

                    <div className="space-y-3 text-sm text-blue-900/80">
                      <p>• You will be redirected to the official {paymentData.method.replace('-', ' ').toUpperCase()} payment page.</p>
                      <p>• Complete payment securely with your wallet or mobile bank app.</p>
                      <p>• After success, you will return automatically to booking confirmation.</p>
                      <p>• Your selected seats and passenger details remain saved.</p>
                    </div>

                    <div className="mt-4 rounded-xl border border-blue-100 bg-white/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Safe redirect enabled
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}
          </form>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-4 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white p-5">
              <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
              <p className="mt-1 text-sm text-gray-500">Review your fare before final payment.</p>
            </div>

            <div className="p-5">
              <div className="mb-5 rounded-2xl bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-800">
                  {selectedFlight.airline} • {selectedFlight.flightNumber}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {selectedFlight.from} → {selectedFlight.to}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {passengers.length} passenger{passengers.length > 1 ? 's' : ''} • {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Flight fare ({passengers.length} passenger{passengers.length > 1 ? 's' : ''})
                  </span>
                  <CurrencyDisplay amount={totals.subtotal} className="font-medium" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taxes & fees</span>
                  <CurrencyDisplay amount={totals.taxes} className="font-medium" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Service fee</span>
                  <CurrencyDisplay amount={totals.serviceFee} className="font-medium" />
                </div>

                <div className="border-t border-dashed pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <CurrencyDisplay amount={totals.total} className="text-xl font-bold text-primary-700" />
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4" />
                  <span>Encrypted and secure payment processing</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <span>No hidden charges during final checkout</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <span>Refund policy available based on fare rules</span>
                </div>
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
          Back to Seats
        </button>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isProcessing}
          className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {isNepalPaymentMethod(paymentData.method)
                ? 'Continue to Secure Payment'
                : 'Complete Payment'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;