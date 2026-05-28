import React, { useState, useEffect } from "react";
import { Search, DollarSign, CreditCard } from "lucide-react";
import { supabase } from "../lib/supabase";
import AdminKeyGate from "./AdminKeyGate";
import { useLanguage } from "../contexts/LanguageContext";

interface PaymentData {
  id: string;
  booking_id: string;
  user_id: string;
  amount_usd: number;
  amount_npr: number;
  exchange_rate: number;
  payment_method: string;
  payment_gateway: string;
  transaction_id: string;
  status: string;
  payment_date: string;
  booking?: {
    booking_reference: string;
    passenger_name: string;
  };
}

const PaymentManagement = () => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { t, language } = useLanguage();

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    const filtered = payments.filter(
      (payment) =>
        payment.transaction_id
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.booking?.booking_reference
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.booking?.passenger_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        booking:bookings(booking_reference, passenger_name)
      `,
      )
      .order("payment_date", { ascending: false });

    if (!error && data) {
      setPayments(data as any);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount_usd), 0);

  const totalRevenueNPR = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount_npr), 0);

  return (
    <AdminKeyGate>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("admin.payments")}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">{t("stats.revenueUSD")}</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{t("stats.revenueNPR")}</p>
                <p className="text-2xl font-bold text-blue-600">
                  रू {totalRevenueNPR.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`${t("common.search")} payments by transaction ID or booking reference...`}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.reference")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("bookings.passenger")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (USD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (NPR)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("flights.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {payment.booking?.booking_reference || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.booking?.passenger_name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {payment.transaction_id || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${Number(payment.amount_usd).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        रू {Number(payment.amount_npr).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Rate: {payment.exchange_rate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.payment_method}
                      </div>
                      {payment.payment_gateway && (
                        <div className="text-xs text-gray-500">
                          {payment.payment_gateway}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          payment.status,
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.payment_date).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {language === "en"
                  ? "No payments found"
                  : "कुनै भुक्तानी फेला परेन"}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminKeyGate>
  );
};

export default PaymentManagement;
