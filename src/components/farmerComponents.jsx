import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from './commonComponents';

/**
 * FarmerSearch Component
 * Search farmers by name
 */
export const FarmerSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="mb-6">
      <Input
        placeholder="🔍 Search farmer by name"
        value={searchTerm}
        onChange={handleChange}
        className="text-lg"
      />
    </div>
  );
};

/**
 * FarmerCard Component
 * Display farmer info in card format
 */
export const FarmerCard = ({ farmer, onSelect, onEdit, onDelete }) => {
  const initials = (farmer.name || '')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'F';

  const fatherNameText = farmer.fatherName
    ? `S/O ${farmer.fatherName}`.toUpperCase()
    : 'S/O -';

  const locationText = `${farmer.village || '-'} • Post ${farmer.post || '-'}`.toUpperCase();

  const remainingBags = typeof farmer.remainingBags === 'number' ? farmer.remainingBags : 0;
  const remainingColorClass =
    remainingBags >= 100
      ? 'text-emerald-700'
      : remainingBags >= 30
        ? 'text-amber-600'
        : 'text-rose-600';

  return (
    <div className="bg-white/80 border border-white/60 shadow-lg shadow-slate-200/40 backdrop-blur-md rounded-3xl p-4 mb-4 transition hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-bold text-lg shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {(farmer.name || 'Unnamed Farmer').toUpperCase()}
            </h3>
            <p className="text-sm text-slate-500 truncate">{fatherNameText}</p>
            <p className="text-sm text-slate-400 truncate">{locationText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(farmer)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:scale-105 transition flex items-center justify-center"
            aria-label="View Ledger"
          >
            📄
          </button>
          <button
            onClick={() => onEdit(farmer)}
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:scale-105 transition flex items-center justify-center"
            aria-label="Edit Farmer"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(farmer.id)}
            className="h-10 w-10 rounded-2xl border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:scale-105 transition flex items-center justify-center"
            aria-label="Delete Farmer"
          >
            🗑
          </button>
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-3">
        <p className={`text-base font-semibold ${remainingColorClass}`}>Remaining: {remainingBags} Bags</p>
      </div>
    </div>
  );
};

/**
 * FarmerForm Component
 */
export const FarmerForm = ({
  initialData = {},
  onSubmit,
  loading,
  submitLabel = 'Save Farmer',
  sessionOptions = [],
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    village: '',
    post: '',
    phone: '',
    sessionId: sessionOptions[0]?.value || '',
    rentPerBag: '',
    initialBags: '',
    ...initialData,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Only reset form data if initialData has changed (for edit mode)
    const hasInitialData = Object.keys(initialData).length > 0;
    if (hasInitialData) {
      setFormData({
        name: '',
        fatherName: '',
        village: '',
        post: '',
        phone: '',
        sessionId: initialData.sessionId || sessionOptions[0]?.value || '',
        rentPerBag: initialData.rentPerBag || '',
        initialBags: initialData.initialBags || '',
        ...initialData,
      });
    }
  }, [initialData, sessionOptions]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Farmer name is required';
    }
    if (!isEditing && !formData.sessionId) {
      newErrors.sessionId = 'Session is required';
    }
    if (!formData.rentPerBag || parseFloat(formData.rentPerBag) <= 0) {
      newErrors.rentPerBag = 'Rate per bag is required';
    }
    if (!formData.initialBags || parseFloat(formData.initialBags) < 0) {
      newErrors.initialBags = 'Initial deposit bags is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      // Reset form only after successful submission for add mode
      if (Object.keys(initialData).length === 0) {
        setFormData({
          name: '',
          fatherName: '',
          village: '',
          post: '',
          phone: '',
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Farmer Name"
        placeholder="Enter farmer name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
      />

      <Input
        label="Father Name"
        placeholder="Enter father's name"
        value={formData.fatherName}
        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
      />

      <Input
        label="Village"
        placeholder="Enter village name"
        value={formData.village}
        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
      />

      <Input
        label="Post"
        placeholder="Enter post name"
        value={formData.post}
        onChange={(e) => setFormData({ ...formData, post: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
          label="Initial Deposit Bags"
          placeholder="Enter initial bags"
          type="number"
          value={formData.initialBags}
          onChange={(e) => setFormData({ ...formData, initialBags: e.target.value })}
          error={errors.initialBags}
          required
          min="0"
          step="1"
        />

        <Input
          label="Rate per Bag"
          placeholder="Enter rent rate"
          type="number"
          value={formData.rentPerBag}
          onChange={(e) => setFormData({ ...formData, rentPerBag: e.target.value })}
          error={errors.rentPerBag}
          required
          min="0"
          step="0.01"
        />
      </div>
          <Select
        label={isEditing ? "Session (Optional)" : "Session"}
        options={isEditing ? [{ value: '', label: 'No Session' }, ...sessionOptions] : sessionOptions}
        value={formData.sessionId}
        onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
        error={errors.sessionId}
        required={!isEditing}
      />
      <Button variant="success" size="lg" disabled={loading} className="!w-full">
        {loading ? `${submitLabel}...` : submitLabel}
      </Button>
    </form>
  );
};

export const AddFarmerForm = (props) => (
  <FarmerForm {...props} submitLabel="Add Farmer" />
);

/**
 * FarmerStats Component
 */

/**
 * FarmerStats Component
 * Display farmer statistics
 */
export const FarmerStats = ({ stats, totalCapacity, totalUsed, defaultRent }) => {
  const availableCapacity = totalCapacity - totalUsed;
  const capacityPercentage = ((totalUsed / totalCapacity) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 md:p-4">
        <p className="text-xs md:text-sm text-gray-600 font-medium">Total Farmers</p>
        <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1">{stats.totalFarmers || 0}</p>
      </div>

      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 md:p-4">
        <p className="text-xs md:text-sm text-gray-600 font-medium">Bags Stored</p>
        <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">{totalUsed || 0}</p>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 md:p-4">
        <p className="text-xs md:text-sm text-gray-600 font-medium">Available Capacity</p>
        <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">{availableCapacity}</p>
      </div>

      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 md:p-4">
        <p className="text-xs md:text-sm text-gray-600 font-medium">Capacity</p>
        <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-1">{capacityPercentage}%</p>
      </div>
    </div>
  );
};
