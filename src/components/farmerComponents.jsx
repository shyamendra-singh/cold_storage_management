import React, { useState } from 'react';
import { Input, Button } from './commonComponents';

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
export const FarmerCard = ({ farmer, onSelect, onDelete }) => {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-3 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">{farmer.name}</h3>
          {farmer.village && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Village:</span> {farmer.village}
            </p>
          )}
          {farmer.phone && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Phone:</span> {farmer.phone}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSelect(farmer)}
          className="flex-1 md:flex-none"
        >
          View Ledger
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(farmer.id)}
          className="flex-1 md:flex-none"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

/**
 * AddFarmerForm Component
 */
export const AddFarmerForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Farmer name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({ name: '', phone: '', village: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Farmer Name *"
        placeholder="Enter farmer name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        required
      />

      <Input
        label="Phone Number (Optional)"
        placeholder="Enter phone number"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />

      <Input
        label="Village (Optional)"
        placeholder="Enter village name"
        value={formData.village}
        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
      />

      <Button variant="success" size="lg" disabled={loading} className="!w-full">
        {loading ? 'Adding...' : 'Add Farmer'}
      </Button>
    </form>
  );
};

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
