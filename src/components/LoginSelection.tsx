import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const LoginSelection: React.FC = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full">
        {/* 🔷 HEADER */}
        <div className="text-center mb-10">
          <div className="bg-white rounded-2xl shadow-lg p-2 inline-block mb-6">
            <img
              src="/Main-Logo.png"
              alt="Company Logo"
              className="h-48 w-full rounded-3xl"
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t("app.title")}
          </h1>

          <p className="text-blue-200 text-sm md:text-base">
            {t("login.selectType")}
          </p>

          <button
            onClick={toggleLanguage}
            className="mt-5 inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition"
          >
            <Globe className="h-5 w-5 mr-2" />
            {language === "en" ? "नेपाली" : "English"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 👤 USER LOGIN */}
          <div
            onClick={() => navigate("/login")}
            className="group bg-white rounded-2xl shadow-xl p-6 md:p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto flex items-center justify-center bg-blue-100 rounded-full mb-5 group-hover:bg-blue-200 transition">
                <User className="h-8 w-8 text-blue-600" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                {t("login.user")}
              </h2>

              <p className="text-gray-600 text-sm mb-5">
                {language === "en"
                  ? "Book flights, manage bookings, and track your travel history."
                  : "उडान बुक गर्नुहोस्, बुकिङ व्यवस्थापन गर्नुहोस् र आफ्नो यात्रा ट्र्याक गर्नुहोस्।"}
              </p>

              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>
                  •{" "}
                  {language === "en"
                    ? "Search & book flights"
                    : "उडान खोज्नुहोस् र बुक गर्नुहोस्"}
                </li>
                <li>
                  •{" "}
                  {language === "en"
                    ? "View booking history"
                    : "बुकिङ इतिहास हेर्नुहोस्"}
                </li>
                <li>
                  •{" "}
                  {language === "en"
                    ? "Manage profile"
                    : "प्रोफाइल व्यवस्थापन गर्नुहोस्"}
                </li>
              </ul>

              <button className="mt-6 w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold">
                {t("login.signIn")}
              </button>
            </div>
          </div>

          <div
            onClick={() => navigate("/admin/login")}
            className="group bg-gradient-to-br from-purple-50 to-blue-50 border border-blue-200 rounded-2xl shadow-xl p-6 md:p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto flex items-center justify-center bg-purple-100 rounded-full mb-5 group-hover:bg-purple-200 transition">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                {t("login.admin")}
              </h2>

              <p className="text-gray-600 text-sm mb-5">
                {language === "en"
                  ? "Manage users, flights, bookings, and analytics."
                  : "प्रयोगकर्ता, उडान, बुकिङ र विश्लेषण व्यवस्थापन गर्नुहोस्।"}
              </p>

              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>
                  •{" "}
                  {language === "en"
                    ? "Manage flights & users"
                    : "उडान र प्रयोगकर्ता व्यवस्थापन"}
                </li>
                <li>
                  • {language === "en" ? "View reports" : "रिपोर्ट हेर्नुहोस्"}
                </li>
                <li>
                  • {language === "en" ? "System control" : "प्रणाली नियन्त्रण"}
                </li>
              </ul>

              <button className="mt-6 w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition font-semibold">
                {t("login.signIn")}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-blue-200 text-sm">
          <p>
            {language === "en"
              ? "Need help? Contact support anytime."
              : "मद्दत चाहिन्छ? हामीलाई कुनै पनि समयमा सम्पर्क गर्नुहोस्।"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
