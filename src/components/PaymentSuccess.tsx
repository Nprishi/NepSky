import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ESewaPaymentService } from '../services/paymentService';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      const oid = searchParams.get('oid');
      const amt = searchParams.get('amt');
      const refId = searchParams.get('refId');

      console.log('Payment Success Page - Parameters:', { oid, amt, refId });
      if (!oid || !amt || !refId) {
        console.error('Missing payment parameters:', { oid, amt, refId });
        setVerificationStatus('failed');
        setMessage('Invalid payment parameters');
        return;
      }

      try {
        console.log('Starting payment verification...');
        const result = await ESewaPaymentService.verifyPayment(oid, parseFloat(amt), refId);
        console.log('Verification result:', result);

        if (result.success) {
          console.log('Payment verified successfully');
          setVerificationStatus('success');
          setMessage('Payment verified successfully!');

          localStorage.setItem(`payment_${oid}`, 'success');
          console.log('Stored success status in localStorage');

          setTimeout(() => {
            console.log('Closing payment window...');
            window.close();
          }, 3000);
        } else {
          console.error('Payment verification failed:', result.message);
          setVerificationStatus('failed');
          setMessage(result.message || 'Payment verification failed');
          localStorage.setItem(`payment_${oid}`, 'failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('failed');
        setMessage('Error verifying payment: ' + (error as Error).message);
        localStorage.setItem(`payment_${oid}`, 'failed');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {verificationStatus === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">This window will close automatically...</p>
            </>
          )}

          {verificationStatus === 'failed' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => window.close()}
                className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors flex items-center mx-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Close Window
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;