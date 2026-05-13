import React, { useEffect } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('Payment Failure Page - Parameters:', Object.fromEntries(searchParams));
    const oid = searchParams.get('oid') || `payment_${Date.now()}`;
    console.log('Storing failure status for:', oid);
    localStorage.setItem(`payment_${oid}`, 'failed');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            Your payment could not be processed. Please try again or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.close()}
            className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors flex items-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;