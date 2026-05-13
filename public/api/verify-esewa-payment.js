// Mock API endpoint for eSewa payment verification
// In a real application, this would be a backend service

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderId, amount, refId, merchantCode } = req.body;

  console.log('eSewa Verification Request:', { orderId, amount, refId, merchantCode });
  // Simulate eSewa verification API call
  // In production, this would make an actual HTTP request to eSewa's verification endpoint
  try {
    // Mock verification logic
    if (refId && orderId && amount) {
      // Simulate successful verification (95% success rate for testing)
      const isSuccess = Math.random() > 0.05;
      
      console.log('Verification simulation result:', isSuccess);
      
      if (isSuccess) {
        console.log('Payment verification successful');
        res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          transactionId: refId,
          orderId: orderId,
          amount: amount
        });
      } else {
        console.log('Payment verification failed (simulated)');
        res.status(400).json({
          success: false,
          message: 'Payment verification failed'
        });
      }
    } else {
      console.error('Missing required parameters:', { refId, orderId, amount });
      res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
}