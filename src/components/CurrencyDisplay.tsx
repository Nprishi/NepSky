import React, { useEffect, useState } from 'react';
import {
  convertCurrency,
  formatCurrency,
  fetchExchangeRates,
  type ExchangeRates,
} from '../utils/currencyConverter';
import { RefreshCw } from 'lucide-react';

interface CurrencyDisplayProps {
  amount: number;
  baseCurrency?: keyof ExchangeRates;
  showBoth?: boolean;
  className?: string;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  baseCurrency = 'USD',
  showBoth = true,
  className = '',
}) => {
  const [nprAmount, setNprAmount] = useState<number | null>(null);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadConversion = async () => {
    if (baseCurrency === 'NPR') {
      setNprAmount(amount);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const fetchedRates = await fetchExchangeRates();
      setRates(fetchedRates);

      const converted = convertCurrency(
        amount,
        baseCurrency,
        'NPR',
        fetchedRates
      );

      setNprAmount(converted);
    } catch (err) {
      console.error('Currency error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversion();
  }, [amount, baseCurrency]);

  const refresh = () => {
    loadConversion();
  };

  // SINGLE CURRENCY MODE
  if (!showBoth) {
    return <span className={className}>{formatCurrency(amount, baseCurrency)}</span>;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* NPR (MAIN) */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-primary-600">
          {nprAmount !== null
            ? formatCurrency(nprAmount, 'NPR')
            : formatCurrency(amount, baseCurrency)}
        </span>

        {baseCurrency !== 'NPR' && (
          <button
            onClick={refresh}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* USD (SECONDARY) */}
      {baseCurrency !== 'NPR' && (
        <div className="text-sm text-gray-500">
          {loading ? (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Converting...
            </span>
          ) : error ? (
            <span className="text-red-500">Rate unavailable</span>
          ) : (
            <span>({formatCurrency(amount, baseCurrency)})</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrencyDisplay;