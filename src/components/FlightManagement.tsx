import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Plane } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabase';
import AdminKeyGate from './AdminKeyGate';
import { useLanguage } from '../contexts/LanguageContext';

interface FlightData {
  id: string;
  flight_number: string;
  airline: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  available_seats: number;
  total_seats: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  aircraft_type: string;
  created_at: string;
  updated_at: string;
}

const FlightManagement = () => {
  const openSwalWithNavClose = (options: any) => {
    const onNav = () => {
      try {
        if (Swal.isVisible && Swal.isVisible()) Swal.close();
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('popstate', onNav);
    window.addEventListener('beforeunload', onNav);
    window.addEventListener('hashchange', onNav);

    return Swal.fire(options).finally(() => {
      window.removeEventListener('popstate', onNav);
      window.removeEventListener('beforeunload', onNav);
      window.removeEventListener('hashchange', onNav);
    });
  };
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<FlightData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState<FlightData | null>(null);
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    flight_number: '',
    airline: '',
    from_location: '',
    to_location: '',
    departure_time: '',
    arrival_time: '',
    price: '',
    available_seats: '',
    total_seats: '',
    status: 'scheduled' as FlightData['status'],
    aircraft_type: '',
  });

  useEffect(() => {
    loadFlights();
  }, []);

  useEffect(() => {
    const filtered = flights.filter(
      (flight) =>
        flight.flight_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.to_location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFlights(filtered);
  }, [searchTerm, flights]);

  const loadFlights = async () => {
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .order('departure_time', { ascending: true });

    if (!error && data) {
      setFlights(data);
    }
  };

  const handleAdd = () => {
    setEditingFlight(null);
    setFormData({
      flight_number: '',
      airline: '',
      from_location: '',
      to_location: '',
      departure_time: '',
      arrival_time: '',
      price: '',
      available_seats: '',
      total_seats: '',
      status: 'scheduled',
      aircraft_type: '',
    });
    setShowModal(true);
  };

  const handleEdit = (flight: FlightData) => {
    setEditingFlight(flight);
    setFormData({
      flight_number: flight.flight_number,
      airline: flight.airline,
      from_location: flight.from_location,
      to_location: flight.to_location,
      departure_time: new Date(flight.departure_time).toISOString().slice(0, 16),
      arrival_time: new Date(flight.arrival_time).toISOString().slice(0, 16),
      price: flight.price.toString(),
      available_seats: flight.available_seats.toString(),
      total_seats: flight.total_seats.toString(),
      status: flight.status,
      aircraft_type: flight.aircraft_type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const expected = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').toString().trim();

    if (!expected) {
      await openSwalWithNavClose({ icon: 'error', title: 'Config error', text: 'Admin key not configured.' });
      return;
    }

    const { value, isConfirmed } = await openSwalWithNavClose({
      title: 'Confirm admin key',
      input: 'password',
      inputAttributes: {
        autocomplete: 'new-password',
        name: 'admin_key',
        autocapitalize: 'off',
        spellcheck: 'false',
      },
      inputPlaceholder: 'Supabase anon key',
      showCancelButton: true,
      confirmButtonText: 'Verify & Delete',
      preConfirm: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) Swal.showValidationMessage('Key is required');
        return trimmed;
      },
    });

    if (!isConfirmed) return;

    if ((value as string).toString().trim() !== expected) {
      await openSwalWithNavClose({ icon: 'error', title: 'Access denied', text: 'Invalid admin key' });
      return;
    }

   
    sessionStorage.setItem('supabase_key_verified', 'true');

    const confirmResult = await openSwalWithNavClose({
      title: 'Delete flight?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });

    if (!confirmResult.isConfirmed) return;

    const { error } = await supabase.from('flights').delete().eq('id', id);
    if (error) {
      console.error('Delete flight error:', error);
      await openSwalWithNavClose({ icon: 'error', title: 'Delete failed', text: error.message });
    } else {
      await openSwalWithNavClose({ icon: 'success', title: 'Deleted', timer: 1000, showConfirmButton: false });
      loadFlights();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const expected = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').toString().trim();

    if (!expected) {
      await openSwalWithNavClose({ icon: 'error', title: 'Config error', text: 'Admin key not configured.' });
      return;
    }

    const { value, isConfirmed } = await openSwalWithNavClose({
      title: 'Confirm Admin key',
      input: 'password',
      inputAttributes: {
        autocomplete: 'new-password',
        name: 'admin_key',
        autocapitalize: 'off',
        spellcheck: 'false',
      },
      inputPlaceholder: 'Supabase anon key',
      showCancelButton: true,
      confirmButtonText: 'Verify & Submit',
      preConfirm: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) Swal.showValidationMessage('Key is required');
        return trimmed;
      },
    });

    if (!isConfirmed) return;

    if ((value as string).toString().trim() !== expected) {
      await openSwalWithNavClose({ icon: 'error', title: 'Access denied', text: 'Invalid admin key' });
      return;
    }

    sessionStorage.setItem('supabase_key_verified', 'true');

    const flightData = {
      ...formData,
      price: parseFloat(formData.price),
      available_seats: parseInt(formData.available_seats),
      total_seats: parseInt(formData.total_seats),
      updated_at: new Date().toISOString(),
    };

    if (editingFlight) {
      const { error } = await supabase
        .from('flights')
        .update(flightData)
        .eq('id', editingFlight.id);

      if (error) {
        console.error('Error updating flight:', error);
        await openSwalWithNavClose({ icon: 'error', title: 'Failed to update flight', text: error.message });
        return;
      }
      await openSwalWithNavClose({ icon: 'success', title: 'Updated', timer: 1000, showConfirmButton: false });
    } else {
      const newFlightData = {
        ...flightData,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('flights').insert([newFlightData]);

      if (error) {
        console.error('Error adding flight:', error);
        await openSwalWithNavClose({ icon: 'error', title: 'Failed to add flight', text: error.message });
        return;
      }
      await openSwalWithNavClose({ icon: 'success', title: 'Created', timer: 1000, showConfirmButton: false });
    }

    setShowModal(false);
    loadFlights();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'boarding':
        return 'bg-yellow-100 text-yellow-800';
      case 'departed':
        return 'bg-purple-100 text-purple-800';
      case 'arrived':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminKeyGate>
      <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.flights')}</h2>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('flights.add')}
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`${t('common.search')} flights...`}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('flights.flightNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('flights.departure')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('flights.price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('flights.seats')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('flights.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFlights.map((flight) => (
                <tr key={flight.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Plane className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{flight.flight_number}</div>
                        <div className="text-sm text-gray-500">{flight.airline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{flight.from_location}</div>
                    <div className="text-sm text-gray-500">→ {flight.to_location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(flight.departure_time).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(flight.departure_time).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${flight.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {flight.available_seats}/{flight.total_seats}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        flight.status
                      )}`}
                    >
                      {flight.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(flight)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(flight.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 my-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingFlight ? t('flights.edit') : t('flights.add')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('flights.flightNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.flight_number}
                    onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('flights.airline')}</label>
                  <input
                    type="text"
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('flights.from')}</label>
                  <input
                    type="text"
                    value={formData.from_location}
                    onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('flights.to')}</label>
                  <input
                    type="text"
                    value={formData.to_location}
                    onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('flights.departure')}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('flights.arrival')}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.arrival_time}
                    onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('flights.price')} (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available
                  </label>
                  <input
                    type="number"
                    value={formData.available_seats}
                    onChange={(e) => setFormData({ ...formData, available_seats: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                  <input
                    type="number"
                    value={formData.total_seats}
                    onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aircraft Type
                  </label>
                  <input
                    type="text"
                    value={formData.aircraft_type}
                    onChange={(e) => setFormData({ ...formData, aircraft_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('flights.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as FlightData['status'] })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="boarding">Boarding</option>
                    <option value="departed">Departed</option>
                    <option value="arrived">Arrived</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingFlight ? t('common.update') : t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminKeyGate>
  );
};

export default FlightManagement;
