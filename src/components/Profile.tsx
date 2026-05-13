import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Camera,
  Save,
  Edit3,
  X,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ProfileFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  profilePicture: string;
};

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialData: ProfileFormData = useMemo(
    () => ({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      nationality: user?.nationality || '',
      passportNumber: user?.passportNumber || '',
      profilePicture: user?.profilePicture || '',
    }),
    [user]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setProfileData(initialData);
  }, [initialData]);

  const countries = [
    'Nepal',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Japan',
    'South Korea',
    'Singapore',
    'India',
    'China',
    'Thailand',
    'Malaysia',
    'UAE',
  ];

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateImageFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG, and WEBP images are allowed';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageError = validateImageFile(file);
    if (imageError) {
      setErrors((prev) => ({
        ...prev,
        profilePicture: imageError,
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;

      setProfileData((prev) => ({
        ...prev,
        profilePicture: base64Image,
      }));

      setErrors((prev) => ({
        ...prev,
        profilePicture: '',
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileData((prev) => ({
      ...prev,
      profilePicture: '',
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (profileData.phone.trim().length < 7) {
      newErrors.phone = 'Enter a valid phone number';
    }

    if (profileData.passportNumber && profileData.passportNumber.length < 6) {
      newErrors.passportNumber = 'Passport number looks too short';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setErrors((prev) => ({ ...prev, general: '' }));

    try {
      await updateProfile({
        ...profileData,
        passportNumber: profileData.passportNumber.toUpperCase(),
      });

      setIsEditing(false);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: 'Failed to update profile. Please try again.',
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData(initialData);
    setErrors({});
    setIsEditing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUserInitials = () => {
    const first = profileData.firstName?.charAt(0) || '';
    const last = profileData.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <p className="text-slate-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const inputBaseClass =
    'w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400';
  const editableClass =
    'border-slate-300 bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
  const readonlyClass =
    'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  {profileData.profilePicture ? (
                    <img
                      src={profileData.profilePicture}
                      alt="Profile"
                      className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg sm:h-28 sm:w-28"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white text-2xl font-bold text-sky-600 shadow-lg sm:h-28 sm:w-28">
                      {getUserInitials()}
                    </div>
                  )}

                  {isEditing && (
                    <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full bg-sky-600 p-2 text-white shadow-md transition hover:bg-sky-700"
                        title="Change image"
                      >
                        <Camera className="h-4 w-4" />
                      </button>

                      {profileData.profilePicture && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="rounded-full bg-rose-600 p-2 text-white shadow-md transition hover:bg-rose-700"
                          title="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="text-white">
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    {profileData.firstName || 'Your'} {profileData.lastName || 'Profile'}
                  </h1>
                  <p className="mt-1 text-sm text-sky-100 sm:text-base">{profileData.email}</p>
                  <p className="text-sm text-sky-100 sm:text-base">{profileData.phone}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-slate-100"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="inline-flex items-center rounded-xl bg-slate-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {errors.general && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm text-rose-700">{errors.general}</p>
              </div>
            )}

            {errors.profilePicture && (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm text-rose-700">{errors.profilePicture}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <h3 className="mb-5 text-lg font-semibold text-slate-900">
                  Personal Information
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={!isEditing}
                        className={`${inputBaseClass} pl-11 ${isEditing ? editableClass : readonlyClass} ${errors.firstName ? 'border-rose-300 focus:ring-rose-100' : ''}`}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-rose-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={!isEditing}
                        className={`${inputBaseClass} pl-11 ${isEditing ? editableClass : readonlyClass} ${errors.lastName ? 'border-rose-300 focus:ring-rose-100' : ''}`}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-rose-600">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        disabled={!isEditing}
                        className={`${inputBaseClass} pl-11 ${isEditing ? editableClass : readonlyClass}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nationality
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={profileData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        disabled={!isEditing}
                        className={`${inputBaseClass} pl-11 ${isEditing ? editableClass : readonlyClass}`}
                      >
                        <option value="">Select nationality</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <h3 className="mb-5 text-lg font-semibold text-slate-900">
                  Contact & Travel Details
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className={`${inputBaseClass} pl-11 ${isEditing ? editableClass : readonlyClass} ${errors.email ? 'border-rose-300 focus:ring-rose-100' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-rose-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className={`${inputBaseClass} pl-11 ${isEditing ? editableClass : readonlyClass} ${errors.phone ? 'border-rose-300 focus:ring-rose-100' : ''}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-rose-600">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Passport Number
                    </label>
                    <div className="relative">
                      <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.passportNumber}
                        onChange={(e) =>
                          handleInputChange('passportNumber', e.target.value.toUpperCase())
                        }
                        disabled={!isEditing}
                        placeholder="Passport number"
                        className={`${inputBaseClass} pl-11 ${isEditing ? editableClass : readonlyClass} ${errors.passportNumber ? 'border-rose-300 focus:ring-rose-100' : ''}`}
                      />
                    </div>
                    {errors.passportNumber && (
                      <p className="mt-1 text-sm text-rose-600">{errors.passportNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                Profile image and all editable fields will be sent through your existing
                <span className="mx-1 font-semibold">updateProfile(profileData)</span>
                flow. If your current backend already saves these fields, they will persist in the database.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;