import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Plane, Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const SignupSelection = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center bg-white rounded-full mb-6 shadow-lg w-full">
            <img
              src="/Main-Logo.png"
              alt="Company Logo"
              className="h-48 w-full rounded-3xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            {t("app.title")}
          </h1>
          <p className="text-xl text-blue-200">
            {language === "en"
              ? "Sign Up or Login"
              : "साइन अप गर्नुहोस् वा लगइन गर्नुहोस्"}
          </p>

          <button
            onClick={toggleLanguage}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Globe className="h-5 w-5 mr-2" />
            {language === "en" ? "नेपाली" : "English"}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div
            onClick={() => navigate("/signup")}
            className="bg-white rounded-2xl shadow-2xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-3xl"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {language === "en"
                  ? "Sign Up as User"
                  : "प्रयोगकर्ता को रूपमा साइन अप गर्नुहोस्"}
              </h2>
              <p className="text-gray-600 mb-6">
                {language === "en"
                  ? "Create a new account to book flights and manage your bookings."
                  : "उडान बुक गर्न र आफ्नो बुकिङ व्यवस्थापन गर्न नयाँ खाता बनाउनुहोस्।"}
              </p>
              <div className="space-y-3 text-left text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  {language === "en"
                    ? "Book flights instantly"
                    : "तुरुन्त उडान बुक गर्नुहोस्"}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  {language === "en"
                    ? "Manage your bookings"
                    : "आफ्नो बुकिङ व्यवस्थापन गर्नुहोस्"}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  {language === "en"
                    ? "Track your travel history"
                    : "आफ्नो यात्रा इतिहास ट्र्याक गर्नुहोस्"}
                </div>
              </div>
              <button className="mt-8 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                {language === "en"
                  ? "Sign Up as User"
                  : "प्रयोगकर्ता को रूपमा साइन अप गर्नुहोस्"}
              </button>
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/login")}
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-2xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-3xl border-2 border-blue-200"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {language === "en"
                  ? "Login as Admin"
                  : "प्रशासक को रूपमा लगइन गर्नुहोस्"}
              </h2>
              <p className="text-gray-600 mb-6">
                {language === "en"
                  ? "Access the admin dashboard to manage the system."
                  : "प्रणाली व्यवस्थापन गर्न प्रशासक ड्यासबोर्ड पहुँच गर्नुहोस्।"}
              </p>
              <div className="space-y-3 text-left text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                  {language === "en"
                    ? "Manage users and flights"
                    : "प्रयोगकर्ताहरू र उडानहरू व्यवस्थापन गर्नुहोस्"}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                  {language === "en"
                    ? "View analytics and reports"
                    : "विश्लेषण र रिपोर्टहरू हेर्नुहोस्"}
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                  {language === "en"
                    ? "Configure system settings"
                    : "प्रणाली सेटिङहरू कन्फिगर गर्नुहोस्"}
                </div>
              </div>
              <button className="mt-8 w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                {language === "en"
                  ? "Login as Admin"
                  : "प्रशासक को रूपमा लगइन गर्नुहोस्"}
              </button>

              <div className="mt-6 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-800 font-medium mb-1">
                  {language === "en"
                    ? "Admin Credentials:"
                    : "प्रशासक प्रमाणहरू:"}
                </p>
                <p className="text-xs text-purple-700">adminself@gmail.com</p>
                <p className="text-xs text-purple-700">Password: adminself</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-blue-200 mb-4">
            {language === "en"
              ? "Already have an account?"
              : "के तपाईंसँग पहिले नै खाता छ?"}
          </p>
          <button
            onClick={() => navigate("/select-login")}
            className="px-6 py-3 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg"
          >
            {language === "en" ? "Go to Login" : "लगइन मा जानुहोस्"}
          </button>
        </div>

        <div className="mt-8 text-center text-blue-200 text-sm">
          <p>
            {language === "en"
              ? "Need help? Contact us at "
              : "मद्दत चाहिन्छ? हामीलाई सम्पर्क गर्नुहोस् "}
            <a
              href="mailto:info@nepalairlines.com"
              className="text-white hover:underline"
            >
              info@nepalairlines.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupSelection;
