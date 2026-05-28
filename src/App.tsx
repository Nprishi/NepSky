import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { AdminProvider } from './contexts/AdminContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Header';
import Home from './components/Home';
import LoginSelection from './components/LoginSelection';
import SignupSelection from './components/SignupSelection';
import Login from './components/Login';
import Signup from './components/Signup';
import BookingFlow from './components/BookingFlow';
import MyBookings from './components/MyBookings';
import Profile from './components/Profile';
import CheckIn from './components/CheckIn';
import Support from './components/Support';
import Settings from './components/Settings';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentFailure from './components/PaymentFailure';
import AdminLogin from './components/AdminLogin';
import NewAdminDashboard from './components/NewAdminDashboard';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BookingProvider>
          <SiteSettingsProvider>
            <AdminProvider>
              <Router>
                <Routes>
                  <Route path="/select-login" element={<LoginSelection />} />
                  <Route path="/select-signup" element={<SignupSelection />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<NewAdminDashboard />} />
                  <Route
                    path="/*"
                    element={
                      <div className="min-h-screen bg-gray-50">
                        <Header />
                        <main>
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/booking" element={<BookingFlow />} />
                            <Route path="/my-bookings" element={<MyBookings />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/check-in" element={<CheckIn />} />
                            <Route path="/support" element={<Support />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/payment/success" element={<PaymentSuccess />} />
                            <Route path="/payment/failure" element={<PaymentFailure />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </main>
                      </div>
                    }
                  />
                </Routes>
              </Router>
            </AdminProvider>
          </SiteSettingsProvider>
        </BookingProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;