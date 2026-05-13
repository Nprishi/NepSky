import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'Global Air Ticketing System',
    'login.selectType': 'Select Login Type',
    'login.user': 'User Login',
    'login.admin': 'Admin Login',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signUp': 'Sign Up',
    'login.forgotPassword': 'Forgot Password?',
    'admin.dashboard': 'Admin Dashboard',
    'admin.overview': 'Overview',
    'admin.users': 'Users',
    'admin.flights': 'Flights',
    'admin.bookings': 'Bookings',
    'admin.payments': 'Payments',
    'admin.settings': 'Settings',
    'admin.logout': 'Logout',
    'stats.totalUsers': 'Total Users',
    'stats.totalFlights': 'Total Flights',
    'stats.totalBookings': 'Total Bookings',
    'stats.totalRevenue': 'Total Revenue',
    'stats.revenueUSD': 'Revenue (USD)',
    'stats.revenueNPR': 'Revenue (NPR)',
    'flights.add': 'Add Flight',
    'flights.edit': 'Edit Flight',
    'flights.delete': 'Delete Flight',
    'flights.flightNumber': 'Flight Number',
    'flights.airline': 'Airline',
    'flights.from': 'From',
    'flights.to': 'To',
    'flights.departure': 'Departure',
    'flights.arrival': 'Arrival',
    'flights.price': 'Price',
    'flights.seats': 'Seats',
    'flights.status': 'Status',
    'users.add': 'Add User',
    'users.edit': 'Edit User',
    'users.delete': 'Delete User',
    'users.email': 'Email',
    'users.name': 'Full Name',
    'users.phone': 'Phone',
    'users.role': 'Role',
    'users.status': 'Status',
    'bookings.reference': 'Booking Reference',
    'bookings.passenger': 'Passenger',
    'bookings.flight': 'Flight',
    'bookings.amount': 'Amount',
    'bookings.paymentStatus': 'Payment Status',
    'bookings.bookingStatus': 'Booking Status',
    'settings.exchangeRate': 'Exchange Rate (USD to NPR)',
    'settings.siteName': 'Site Name',
    'settings.siteEmail': 'Site Email',
    'settings.sitePhone': 'Site Phone',
    'settings.esewaId': 'eSewa Merchant ID',
    'settings.esewaKey': 'eSewa Secret Key',
    'settings.save': 'Save Settings',
    'common.search': 'Search',
    'common.actions': 'Actions',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.loading': 'Loading...',
  },
  ne: {
    'app.title': 'अन्तर्राष्ट्रिय हवाई टिकट प्रणाली',
    'login.selectType': 'लगइन प्रकार छान्नुहोस्',
    'login.user': 'प्रयोगकर्ता लगइन',
    'login.admin': 'प्रशासक लगइन',
    'login.email': 'इमेल ठेगाना',
    'login.password': 'पासवर्ड',
    'login.signIn': 'साइन इन गर्नुहोस्',
    'login.signUp': 'साइन अप गर्नुहोस्',
    'login.forgotPassword': 'पासवर्ड बिर्सनुभयो?',
    'admin.dashboard': 'प्रशासक ड्यासबोर्ड',
    'admin.overview': 'अवलोकन',
    'admin.users': 'प्रयोगकर्ताहरू',
    'admin.flights': 'उडानहरू',
    'admin.bookings': 'बुकिङहरू',
    'admin.payments': 'भुक्तानीहरू',
    'admin.settings': 'सेटिङहरू',
    'admin.logout': 'लगआउट',
    'stats.totalUsers': 'कुल प्रयोगकर्ताहरू',
    'stats.totalFlights': 'कुल उडानहरू',
    'stats.totalBookings': 'कुल बुकिङहरू',
    'stats.totalRevenue': 'कुल राजस्व',
    'stats.revenueUSD': 'राजस्व (अमेरिकी डलर)',
    'stats.revenueNPR': 'राजस्व (नेपाली रुपैयाँ)',
    'flights.add': 'उडान थप्नुहोस्',
    'flights.edit': 'उडान सम्पादन गर्नुहोस्',
    'flights.delete': 'उडान मेटाउनुहोस्',
    'flights.flightNumber': 'उडान नम्बर',
    'flights.airline': 'एयरलाइन',
    'flights.from': 'बाट',
    'flights.to': 'सम्म',
    'flights.departure': 'प्रस्थान',
    'flights.arrival': 'आगमन',
    'flights.price': 'मूल्य',
    'flights.seats': 'सिटहरू',
    'flights.status': 'स्थिति',
    'users.add': 'प्रयोगकर्ता थप्नुहोस्',
    'users.edit': 'प्रयोगकर्ता सम्पादन गर्नुहोस्',
    'users.delete': 'प्रयोगकर्ता मेटाउनुहोस्',
    'users.email': 'इमेल',
    'users.name': 'पूरा नाम',
    'users.phone': 'फोन',
    'users.role': 'भूमिका',
    'users.status': 'स्थिति',
    'bookings.reference': 'बुकिङ सन्दर्भ',
    'bookings.passenger': 'यात्री',
    'bookings.flight': 'उडान',
    'bookings.amount': 'रकम',
    'bookings.paymentStatus': 'भुक्तानी स्थिति',
    'bookings.bookingStatus': 'बुकिङ स्थिति',
    'settings.exchangeRate': 'विनिमय दर (अमेरिकी डलर देखि नेपाली रुपैयाँ)',
    'settings.siteName': 'साइट नाम',
    'settings.siteEmail': 'साइट इमेल',
    'settings.sitePhone': 'साइट फोन',
    'settings.esewaId': 'eSewa व्यापारी ID',
    'settings.esewaKey': 'eSewa गुप्त कुञ्जी',
    'settings.save': 'सेटिङहरू सुरक्षित गर्नुहोस्',
    'common.search': 'खोज्नुहोस्',
    'common.actions': 'कार्यहरू',
    'common.edit': 'सम्पादन गर्नुहोस्',
    'common.delete': 'मेटाउनुहोस्',
    'common.save': 'सुरक्षित गर्नुहोस्',
    'common.cancel': 'रद्द गर्नुहोस्',
    'common.create': 'सिर्जना गर्नुहोस्',
    'common.update': 'अद्यावधिक गर्नुहोस्',
    'common.loading': 'लोड हुँदैछ...',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'ne')) {
      setLanguage(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ne' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
