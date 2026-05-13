// ================= TYPES =================
export interface ExchangeRates {
  USD: number;
  NPR: number;
  EUR: number;
  GBP: number;
  JPY: number;
}

export interface StoredRates {
  rates: ExchangeRates;
  timestamp: number;
}

// ================= FALLBACK =================
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  NPR: 151.40,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 152.5,
};

// ================= CACHE =================
let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;

const CACHE_DURATION = 30 * 60 * 1000; // 30 min

// ================= FETCH RATES =================
export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  if (cachedRates && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedRates;
  }

  const apis = [
    'https://open.er-api.com/v6/latest/USD',
    'https://api.exchangerate-api.com/v4/latest/USD',
  ];

  for (const url of apis) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();

      if (data?.rates) {
        const rates: ExchangeRates = {
          USD: 1,
          NPR: data.rates.NPR ?? FALLBACK_RATES.NPR,
          EUR: data.rates.EUR ?? FALLBACK_RATES.EUR,
          GBP: data.rates.GBP ?? FALLBACK_RATES.GBP,
          JPY: data.rates.JPY ?? FALLBACK_RATES.JPY,
        };

        cachedRates = rates;
        lastFetchTime = Date.now();

        localStorage.setItem(
          'exchangeRates',
          JSON.stringify({
            rates,
            timestamp: lastFetchTime,
          })
        );

        return rates;
      }
    } catch (err) {
      console.warn('API failed:', url);
    }
  }

  // fallback localStorage
  const stored = localStorage.getItem('exchangeRates');
  if (stored) {
    const parsed: StoredRates = JSON.parse(stored);

    if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      cachedRates = parsed.rates;
      return parsed.rates;
    }
  }

  cachedRates = FALLBACK_RATES;
  return FALLBACK_RATES;
};

// ================= CONVERT =================
export const convertCurrency = (
  amount: number,
  from: keyof ExchangeRates,
  to: keyof ExchangeRates,
  rates: ExchangeRates
): number => {
  if (from === to) return amount;

  const usdBase = from === 'USD' ? amount : amount / rates[from];
  const result = to === 'USD' ? usdBase : usdBase * rates[to];

  return Math.round(result * 100) / 100;
};

// ================= FORMAT =================
export const formatCurrency = (
  amount: number,
  currency: keyof ExchangeRates
): string => {
  const localeMap: Record<keyof ExchangeRates, string> = {
    USD: 'en-US',
    NPR: 'en-NP',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
  };

  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
  }).format(amount);
};