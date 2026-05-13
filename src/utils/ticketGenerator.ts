import { Booking, Flight, Passenger } from '../types';

export interface TicketData {
  booking: Booking;
  flight: Flight;
  passengers: Passenger[];
  selectedNationality?: string;
  localCurrency?: string;
  exchangeRateAtBooking?: number;
  localAmountAtBooking?: number;
  bookingRateTimestamp?: string;
}

interface TicketOptions {
  mode?: 'download' | 'print' | 'preview';
}

export const generateTicketPDF = async (
  ticketData: TicketData,
  options: TicketOptions = {}
): Promise<void> => {
  const { mode = 'download' } = options;

  const {
    booking,
    flight,
    passengers,
    selectedNationality,
    localCurrency,
    exchangeRateAtBooking,
    localAmountAtBooking,
    bookingRateTimestamp,
  } = ticketData;

  const ticketWindow = window.open('', '_blank', 'width=1400,height=1000');

  if (!ticketWindow) {
    alert('Please allow popups to open your NepSky e-ticket.');
    return;
  }

  const escapeHtml = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const safeDate = (value?: string | Date | null): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatTime = (value?: string): string => {
    const date = safeDate(value);
    if (!date) return 'N/A';

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (value?: string): string => {
    const date = safeDate(value);
    if (!date) return 'N/A';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (value?: string): string => {
    const date = safeDate(value);
    if (!date) return 'N/A';

    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatMoney = (amount: number, currency: string): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const getAirportCode = (location: string | undefined, fallback: string): string => {
    if (!location) return fallback;

    const bracketMatch = location.match(/\(([^)]+)\)/);
    if (bracketMatch?.[1]) return bracketMatch[1].trim().toUpperCase();

    const words = location
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (words.length >= 3) return `${words[0][0]}${words[1][0]}${words[2][0]}`.toUpperCase();
    if (words.length === 2) return `${words[0][0]}${words[1][0]}X`.toUpperCase();
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

    return fallback;
  };

  const getAirportName = (location?: string): string => {
    if (!location) return 'N/A';
    return location.split('(')[0].trim();
  };

  const formatPaymentMethod = (method?: string): string => {
    if (!method) return 'N/A';

    return method
      .split(/[-_\s]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const detectNationality = (): string => {
    const bookingAny = booking as Booking & {
      selectedNationality?: string;
      nationality?: string;
      country?: string;
    };

    const passengerAny = passengers?.[0] as Passenger & {
      nationality?: string;
      country?: string;
    };

    return (
      selectedNationality ||
      bookingAny.selectedNationality ||
      bookingAny.nationality ||
      bookingAny.country ||
      passengerAny?.nationality ||
      passengerAny?.country ||
      'Not Specified'
    );
  };

  const detectLocalCurrency = (): string => {
    const bookingAny = booking as Booking & {
      localCurrency?: string;
    };

    return localCurrency || bookingAny.localCurrency || 'N/A';
  };

  const detectBookingRateTimestamp = (): string => {
    const bookingAny = booking as Booking & {
      bookingRateTimestamp?: string;
      exchangeRateTimestamp?: string;
    };

    return (
      bookingRateTimestamp ||
      bookingAny.bookingRateTimestamp ||
      bookingAny.exchangeRateTimestamp ||
      booking.bookingDate ||
      ''
    );
  };

  const resolveExchangeRate = (): number | null => {
    const bookingAny = booking as Booking & {
      exchangeRateAtBooking?: number;
    };

    const rate =
      typeof exchangeRateAtBooking === 'number'
        ? exchangeRateAtBooking
        : typeof bookingAny.exchangeRateAtBooking === 'number'
          ? bookingAny.exchangeRateAtBooking
          : null;

    if (typeof rate !== 'number' || Number.isNaN(rate) || rate <= 0) {
      return null;
    }

    return rate;
  };

  const resolveLocalAmount = (usdAmount: number, rate: number | null): number | null => {
    const bookingAny = booking as Booking & {
      localAmountAtBooking?: number;
    };

    if (
      typeof localAmountAtBooking === 'number' &&
      !Number.isNaN(localAmountAtBooking) &&
      localAmountAtBooking >= 0
    ) {
      return localAmountAtBooking;
    }

    if (
      typeof bookingAny.localAmountAtBooking === 'number' &&
      !Number.isNaN(bookingAny.localAmountAtBooking) &&
      bookingAny.localAmountAtBooking >= 0
    ) {
      return bookingAny.localAmountAtBooking;
    }

    if (rate !== null) {
      return usdAmount * rate;
    }

    return null;
  };

  const getBoardingTime = (departureValue?: string): string => {
    const departureDate = safeDate(departureValue);
    if (!departureDate) return 'N/A';

    const boardingDate = new Date(departureDate.getTime() - 45 * 60 * 1000);
    return boardingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getGate = (flightNumber?: string): string => {
    if (!flightNumber) return 'A12';
    const digits = flightNumber.replace(/\D/g, '');
    const gateNo = digits ? (Number(digits) % 24) + 1 : 12;
    return `A${gateNo}`;
  };

  const getTerminal = (from?: string): string => {
    if (!from) return 'T1';
    const first = from.trim().charCodeAt(0);
    return `T${(first % 3) + 1}`;
  };

  const usdAmount = Number(booking.totalAmount || 0);
  const nationality = detectNationality();
  const resolvedLocalCurrency = detectLocalCurrency();
  const resolvedExchangeRate = resolveExchangeRate();
  const resolvedLocalAmount = resolveLocalAmount(usdAmount, resolvedExchangeRate);
  const resolvedRateTimestamp = detectBookingRateTimestamp();

  const fromCode = getAirportCode(flight.from, 'DEP');
  const toCode = getAirportCode(flight.to, 'ARR');
  const fromName = getAirportName(flight.from);
  const toName = getAirportName(flight.to);
  const barcodeText = `${String(booking.pnr || '').replace(/\s+/g, '')}-${String(
    booking.id || ''
  ).replace(/\s+/g, '')}`;

  const passengerHTML = passengers
    .map((passenger, index) => {
      const fullName = `${passenger.title || ''} ${passenger.firstName || ''} ${passenger.lastName || ''}`
        .replace(/\s+/g, ' ')
        .trim();

      const seat = booking.seats?.[index] || 'TBA';
      const initial = (passenger.firstName?.[0] || passenger.lastName?.[0] || 'P').toUpperCase();

      return `
        <div class="rounded-[16px] border border-slate-200 bg-white p-2.5 shadow-sm">
          <div class="flex items-center justify-between gap-2.5">
            <div class="flex min-w-0 items-start gap-2.5">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-[10px] font-bold text-white">
                ${escapeHtml(initial)}
              </div>

              <div class="min-w-0">
                <div class="truncate text-[12px] font-bold leading-4 text-slate-900">
                  ${escapeHtml(fullName || `Passenger ${index + 1}`)}
                </div>
                <div class="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] leading-4 text-slate-500">
                  <span>Passenger ${index + 1}</span>
                  <span class="h-1 w-1 rounded-full bg-slate-400"></span>
                  <span>Passport: ${escapeHtml(passenger.passportNumber || 'N/A')}</span>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap gap-1 justify-end">
              <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700 ring-1 ring-blue-200">
                Seat ${escapeHtml(seat)}
              </span>
              <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-700 ring-1 ring-slate-200">
                ${escapeHtml(flight.class || 'Economy')}
              </span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const localAmountCard =
    resolvedLocalCurrency !== 'N/A' && resolvedLocalAmount !== null
      ? `
        <div class="rounded-[16px] border border-slate-200 bg-white p-2.5">
          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
            ${escapeHtml(resolvedLocalCurrency)} Amount at Booking Time
          </div>
          <div class="mt-1 text-[16px] font-black leading-none text-blue-700">
            ${escapeHtml(formatMoney(resolvedLocalAmount, resolvedLocalCurrency))}
          </div>
          ${resolvedExchangeRate !== null
        ? `
                <div class="mt-1 text-[9px] leading-4 text-slate-500">
                  1 USD = ${escapeHtml(resolvedExchangeRate.toFixed(4))} ${escapeHtml(
          resolvedLocalCurrency
        )}
                </div>
              `
        : ''
      }
          ${resolvedRateTimestamp
        ? `
                <div class="mt-1 text-[9px] leading-4 text-slate-500">
                  ${escapeHtml(formatDateTime(resolvedRateTimestamp))}
                </div>
              `
        : ''
      }
        </div>
      `
      : `
        <div class="rounded-[16px] border border-amber-200 bg-amber-50 p-2.5">
          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700">
            Local Currency
          </div>
          <div class="mt-1 text-[10px] leading-4 font-semibold text-amber-900">
            Booking-time local currency data was not saved.
          </div>
        </div>
      `;

  const ticketHTML = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NepSky E-Ticket - ${escapeHtml(booking.pnr)}</title>

        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>

       <style>
  @page {
    size: A4;
    margin: 4mm;
  }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .single-page-wrap {
    width: 100%;
    max-height: calc(297mm - 8mm);
    overflow: hidden;
  }

  .ticket-main {
    font-size: 12px;
  }

  .ticket-header {
    padding: 0px 0px;
  }

  .ticket-header-top {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ticket-brand-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ticket-brand-icon {
    height: 48px;
    width: 48px;
    flex-shrink: 0;
  }

  .ticket-brand-title {
    font-size: 22px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .ticket-brand-subtitle {
    margin-top: 3px;
    font-size: 10px;
    line-height: 1.25;
  }

  .ticket-brand-caption {
    margin-top: 3px;
    font-size: 8px;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .ticket-pnr-box {
    min-width: 180px;
    padding: 10px 12px;
  }

  .ticket-pnr-label {
    font-size: 8px;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .ticket-pnr-status {
    margin-top: 4px;
    font-size: 10px;
    line-height: 1.2;
    font-weight: 600;
  }

  .ticket-pnr-code {
    margin-top: 8px;
    font-size: 17px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 0.14em;
  }

  .ticket-route-card {
    margin-top: 12px;
    padding: 12px;
  }

  .ticket-route-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 10px;
  }

  .ticket-airport-code {
    font-size: 32px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.03em;
  }

  .ticket-airport-name {
    margin-top: 4px;
    font-size: 11px;
    line-height: 1.2;
    font-weight: 600;
  }

  .ticket-airport-time {
    margin-top: 6px;
    font-size: 10px;
    line-height: 1.25;
  }

  .ticket-duration-pill {
    padding: 4px 10px;
    font-size: 8px;
    line-height: 1.2;
    letter-spacing: 0.14em;
  }

  .ticket-route-caption {
    margin-top: 6px;
    font-size: 8px;
    line-height: 1.2;
    letter-spacing: 0.14em;
  }

  .ticket-meta-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .ticket-meta-box {
    padding: 8px;
  }

  .ticket-meta-label {
    font-size: 8px;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .ticket-meta-value {
    margin-top: 2px;
    font-size: 10px;
    line-height: 1.2;
    font-weight: 700;
  }

 @media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  .print-shell {
    margin: 0 !important;
    max-width: 100% !important;
    padding: 0 !important;
  }

  .single-page-wrap {
    max-height: none !important;
    overflow: visible !important;
  }

  .print-ticket {
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 16px !important;
    overflow: visible !important;
    backdrop-filter: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .ticket-header {
    padding: 10px 12px !important;
    background: linear-gradient(135deg, #0b1535 0%, #182b63 55%, #3152b8 100%) !important;
    color: white !important;
  }

  .ticket-route-card {
    margin-top: 8px !important;
    padding: 9px !important;
    border-radius: 16px !important;
    background: rgba(255, 255, 255, 0.12) !important;
  }

  .ticket-meta-box {
    padding: 6px !important;
    border-radius: 12px !important;
    background: rgba(255, 255, 255, 0.1) !important;
  }

  .ticket-header-top {
    gap: 8px !important;
  }

  .ticket-brand-wrap {
    gap: 8px !important;
  }

  .ticket-brand-icon {
    height: 38px !important;
    width: 38px !important;
  }

  .ticket-brand-title {
    font-size: 16px !important;
    line-height: 1 !important;
  }

  .ticket-brand-subtitle {
    margin-top: 2px !important;
    font-size: 8px !important;
    line-height: 1.15 !important;
  }

  .ticket-brand-caption {
    margin-top: 2px !important;
    font-size: 7px !important;
    line-height: 1.1 !important;
    letter-spacing: 0.12em !important;
  }

  .ticket-pnr-box {
    min-width: 150px !important;
    padding: 8px 10px !important;
    border-radius: 14px !important;
    background: rgba(255, 255, 255, 0.1) !important;
  }

  .ticket-pnr-label {
    font-size: 7px !important;
  }

  .ticket-pnr-status {
    margin-top: 3px !important;
    font-size: 9px !important;
  }

  .ticket-pnr-code {
    margin-top: 5px !important;
    font-size: 14px !important;
    letter-spacing: 0.1em !important;
  }

  .ticket-route-grid {
    gap: 6px !important;
  }

  .ticket-airport-code {
    font-size: 24px !important;
  }

  .ticket-airport-name {
    margin-top: 2px !important;
    font-size: 9px !important;
    line-height: 1.1 !important;
  }

  .ticket-airport-time {
    margin-top: 4px !important;
    font-size: 8px !important;
    line-height: 1.1 !important;
  }

  .ticket-duration-pill {
    padding: 3px 8px !important;
    font-size: 7px !important;
    letter-spacing: 0.1em !important;
    background: rgba(255, 255, 255, 0.16) !important;
  }

  .ticket-route-caption {
    margin-top: 4px !important;
    font-size: 7px !important;
    letter-spacing: 0.1em !important;
  }

  .ticket-meta-grid {
    margin-top: 8px !important;
    gap: 6px !important;
  }

  .ticket-meta-label {
    font-size: 7px !important;
  }

  .ticket-meta-value {
    margin-top: 1px !important;
    font-size: 8px !important;
  }
}
  
</style>
      </head>

      <body class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_20%),linear-gradient(135deg,_#eff6ff_0%,_#f8fafc_45%,_#e0f2fe_100%)] text-slate-900">
        <div class="print-shell mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-4">

          <div class="no-print mb-3 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onclick="printTicket()"
              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2 text-[13px] font-bold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Print Ticket
            </button>

            <button
              onclick="downloadTicketPDF()"
              class="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-5 py-2 text-[13px] font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5"
            >
              Download PDF
            </button>

            <button
              onclick="window.close()"
              class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-[13px] font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>

          <div id="ticket-download-area" class="print-ticket single-page-wrap overflow-hidden rounded-[24px] border border-white/60 bg-white/90 shadow-[0_18px_42px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <div class="ticket-main">
             <div class="ticket-header relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 text-white">
  <div class="ticket-header-top relative z-10 lg:flex lg:items-start lg:justify-between">
    <div class="ticket-brand-wrap">
      <div class="ticket-brand-icon flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
          <img src="public/Main Logo.png" alt="NepSky" class="h-full w-full"/>   
          <path d="M10 43C21 42 34 33 51 14" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M24 18L50 14L45 40" stroke="#7DD3FC" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 47L29 35" stroke="#BAE6FD" stroke-width="4" stroke-linecap="round"/>
          <path d="M12 32L24 30" stroke="#BAE6FD" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>

      <div>
        <div class="ticket-brand-title">NepSky</div>
        <div class="ticket-brand-subtitle text-blue-100/90">International Air Ticketing System</div>
        <div class="ticket-brand-caption text-sky-200/90">
          Electronic Ticket & Travel Confirmation
        </div>
      </div>
    </div>

    <div class="ticket-pnr-box rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
      <div class="ticket-pnr-label text-blue-100/80">Booking Status</div>
      <div class="ticket-pnr-status flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
        Confirmed
      </div>
      <div class="ticket-pnr-label mt-2 text-blue-100/80">PNR Code</div>
      <div class="ticket-pnr-code">${escapeHtml(booking.pnr || 'N/A')}</div>
    </div>
  </div>

  <div class="ticket-route-card relative z-10 rounded-[20px] border border-white/15 bg-white/10 backdrop-blur">
    <div class="ticket-route-grid">
      <div class="text-center">
        <div class="ticket-airport-code">${escapeHtml(fromCode)}</div>
        <div class="ticket-airport-name">${escapeHtml(fromName)}</div>
        <div class="ticket-airport-time text-blue-100">
          <div class="font-bold text-white">${escapeHtml(formatTime(flight.departureTime))}</div>
          <div>${escapeHtml(formatDate(flight.departureTime))}</div>
        </div>
      </div>

      <div class="text-center">
        <div class="ticket-duration-pill inline-flex rounded-full border border-white/15 bg-white/10 font-bold uppercase text-sky-100">
          ${escapeHtml(flight.duration || 'Duration N/A')}
        </div>
        <div class="ticket-route-caption text-blue-100/80">
          Scheduled Flight
        </div>
      </div>

      <div class="text-center">
        <div class="ticket-airport-code">${escapeHtml(toCode)}</div>
        <div class="ticket-airport-name">${escapeHtml(toName)}</div>
        <div class="ticket-airport-time text-blue-100">
          <div class="font-bold text-white">${escapeHtml(formatTime(flight.arrivalTime))}</div>
          <div>${escapeHtml(formatDate(flight.arrivalTime))}</div>
        </div>
      </div>
    </div>

    <div class="ticket-meta-grid">
      <div class="ticket-meta-box rounded-2xl bg-white/10 text-center">
        <div class="ticket-meta-label text-blue-100/80">Gate</div>
        <div class="ticket-meta-value text-white">${escapeHtml(getGate(flight.flightNumber))}</div>
      </div>
      <div class="ticket-meta-box rounded-2xl bg-white/10 text-center">
        <div class="ticket-meta-label text-blue-100/80">Boarding</div>
        <div class="ticket-meta-value text-white">${escapeHtml(getBoardingTime(flight.departureTime))}</div>
      </div>
      <div class="ticket-meta-box rounded-2xl bg-white/10 text-center">
        <div class="ticket-meta-label text-blue-100/80">Terminal</div>
        <div class="ticket-meta-value text-white">${escapeHtml(getTerminal(flight.from))}</div>
      </div>
    </div>
  </div>
</div>

              <div class="bg-gradient-to-b from-slate-50/80 to-white px-3.5 py-3.5 sm:px-4 sm:py-4">
                <div class="grid grid-cols-[1.34fr_0.96fr] gap-3">

                  <div class="space-y-3">
                    <div class="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                      <div class="mb-2.5 flex items-center justify-between gap-3">
                        <h3 class="text-[14px] font-extrabold text-slate-900">Flight Details</h3>
                        <span class="text-[9px] font-semibold text-slate-500">Travel Information</span>
                      </div>

                      <div class="grid grid-cols-2 gap-2">
                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Flight Number</div>
                          <div class="mt-1 text-[11px] font-bold text-slate-900">${escapeHtml(flight.flightNumber || 'N/A')}</div>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Aircraft</div>
                          <div class="mt-1 text-[11px] font-bold text-slate-900">${escapeHtml(flight.aircraft || 'N/A')}</div>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Cabin Class</div>
                          <div class="mt-1 text-[11px] font-bold text-slate-900">${escapeHtml(flight.class || 'N/A')}</div>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Booking Date</div>
                          <div class="mt-1 text-[10px] font-bold leading-4 text-slate-900">${escapeHtml(formatDateTime(booking.bookingDate))}</div>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Departure</div>
                          <div class="mt-1 text-[10px] font-bold break-words leading-4 text-slate-900">${escapeHtml(flight.from || 'N/A')}</div>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">Arrival</div>
                          <div class="mt-1 text-[10px] font-bold break-words leading-4 text-slate-900">${escapeHtml(flight.to || 'N/A')}</div>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                      <div class="mb-2.5 flex items-center justify-between gap-3">
                        <h3 class="text-[14px] font-extrabold text-slate-900">Passenger Details</h3>
                        <span class="text-[9px] font-semibold text-slate-500">
                          ${passengers.length} Traveler${passengers.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div class="space-y-2">
                        ${passengerHTML || '<div class="text-slate-500 font-medium text-[11px]">No passengers found.</div>'}
                      </div>
                    </div>

                     <div class="rounded-[20px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3 shadow-sm">
                      <div class="mb-2.5 flex items-center justify-between gap-3">
                        <h3 class="text-[14px] font-extrabold text-slate-900">Important Information</h3>
                        <span class="text-[9px] font-semibold text-slate-500">Please Read</span>
                      </div>

                      <ul class="space-y-1.5 pl-4 text-[10px] leading-4.5 text-amber-900 list-disc marker:text-amber-500">
                        <li>Please arrive at the airport at least <strong>3 hours before</strong> international departure.</li>
                        <li>Carry a valid passport and all required visa or travel documents.</li>
                        <li>Passport validity should normally be at least <strong>6 months</strong>.</li>
                        <li>Online check-in usually opens <strong>24 hours before departure</strong>.</li>
                        <li>Baggage allowance may vary by airline and fare class.</li>
                        <li>Please keep this ticket digitally or as a printed copy.</li>
                      </ul>
                    </div>

                  </div>

                  <div class="space-y-3">
                    <div class="rounded-[20px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3 shadow-sm">
                      <div class="mb-2.5 flex items-center justify-between gap-3">
                        <h3 class="text-[14px] font-extrabold text-slate-900">Payment Summary</h3>
                        <span class="text-[9px] font-semibold text-slate-500">Paid Booking</span>
                      </div>

                      <div class="space-y-2">
                        <div class="rounded-[16px] border border-slate-200 bg-white p-2.5">
                          <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">USD Amount</div>
                          <div class="mt-1 text-[16px] font-black leading-none text-emerald-600">
                            ${escapeHtml(formatMoney(usdAmount, 'USD'))}
                          </div>
                        </div>

                        ${localAmountCard}
                      </div>

                      <div class="mt-2.5 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        Paid via ${escapeHtml(formatPaymentMethod(booking.paymentMethod))}
                      </div>

                      <div class="mt-2 text-[9px] leading-4 text-slate-500">
                        Locked to exact booking timestamp.
                      </div>

                      <div class="mt-3 rounded-[16px] border border-slate-200 bg-white p-2.5">
                        <div class="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">QR / Verification</div>
                        <div class="mt-2.5 flex flex-col items-center gap-1.5">
                          <canvas id="qr-code" class="rounded-xl bg-white p-1"></canvas>
                          <div class="mx-auto h-[34px] w-full max-w-[240px] rounded bg-[repeating-linear-gradient(90deg,#111827_0px,#111827_2px,#ffffff_2px,#ffffff_4px,#111827_4px,#111827_5px,#ffffff_5px,#ffffff_8px)]"></div>
                          <div class="break-all text-center font-mono text-[8.5px] tracking-[0.12em] leading-4 text-slate-500">${escapeHtml(barcodeText)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div class="border-t border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                <div class="grid grid-cols-[1fr_auto] gap-3 items-center">
                  <div>
                    <div class="text-[12px] font-extrabold text-slate-900">Thank you for choosing NepSky</div>
                    <div class="mt-1 text-[9px] leading-4 text-slate-500">
                      This document serves as your electronic travel confirmation.
                    </div>
                    <div class="mt-1 text-[8.5px] text-slate-400">
                      Generated on ${escapeHtml(formatDateTime(new Date().toISOString()))}
                    </div>
                  </div>

                  <div class="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div class="text-[8.5px] font-bold uppercase tracking-[0.14em] text-slate-500">Support</div>
                    <div class="mt-1 text-[9px] font-bold text-slate-900">support@nepsky.com</div>
                    <div class="mt-0.5 text-[9px] font-bold text-slate-900">+977-XXXXXXXXXX</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <script>
          function printTicket() {
            document.title = 'NepSky-Ticket-${escapeHtml(
    String(booking.pnr || 'BOOKING').replace(/[^a-zA-Z0-9-_]/g, '')
  )}';
            window.print();
          }

          async function downloadTicketPDF() {
            const element = document.getElementById('ticket-download-area');
            if (!element || !window.html2pdf) {
              alert('PDF generator failed to load.');
              return;
            }

            const filename = 'NepSky-Ticket-${escapeHtml(
    String(booking.pnr || 'BOOKING').replace(/[^a-zA-Z0-9-_]/g, '')
  )}.pdf';

            const opt = {
              margin: [3, 3, 3, 3],
              filename: filename,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                scrollY: 0
              },
              jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
              },
              pagebreak: {
                mode: ['avoid-all', 'css', 'legacy']
              }
            };

            await window.html2pdf().set(opt).from(element).save();
          }

          const qrData = "${escapeHtml(barcodeText)}";
          const canvas = document.getElementById('qr-code');

          if (canvas && window.QRCode) {
            window.QRCode.toCanvas(canvas, qrData, {
              width: 72,
              margin: 1,
              color: {
                dark: '#0f172a',
                light: '#ffffff'
              }
            });
          }

          window.addEventListener('load', async () => {
            if ("${mode}" === "download") {
              setTimeout(async () => {
                await downloadTicketPDF();
              }, 400);
            }

            if ("${mode}" === "print") {
              setTimeout(() => {
                printTicket();
              }, 400);
            }
          });
        </script>
      </body>
    </html>
  `;

  ticketWindow.document.open();
  ticketWindow.document.write(ticketHTML);
  ticketWindow.document.close();
};