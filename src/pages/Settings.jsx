import React, { useState, useEffect } from 'react';
import { Header, Card, Input, Button } from '../components/commonComponents';
import {
  getStorageCapacity,
  setStorageCapacity,
  getDefaultRentPerBag,
  setDefaultRentPerBag,
  getStorageName,
  setStorageName,
} from '../utils/calculations';

export const Settings = ({ onBack, onLogout }) => {
  const [storageName, setStorageNameState] = useState('Cold Storage Management System');
  const [storageCapacity, setStorageCapacityState] = useState(0);
  const [rentPerBag, setRentPerBagState] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings on mount - this ensures fresh data from localStorage
    const loadSettings = () => {
      const name = getStorageName();
      const capacity = getStorageCapacity();
      const rent = getDefaultRentPerBag();
      
      setStorageNameState(name);
      setStorageCapacityState(capacity);
      setRentPerBagState(rent);
      setLoading(false);
    };
    
    loadSettings();
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = () => {
      setStorageNameState(getStorageName());
      setStorageCapacityState(getStorageCapacity());
      setRentPerBagState(getDefaultRentPerBag());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSaveSettings = () => {
    if (!storageName.trim()) {
      alert('Storage name cannot be empty');
      return;
    }

    if (storageCapacity <= 0) {
      alert('Storage capacity must be greater than 0');
      return;
    }

    if (rentPerBag < 0) {
      alert('Rent per bag cannot be negative');
      return;
    }

    setStorageName(storageName.trim());
    setStorageCapacity(parseInt(storageCapacity));
    setDefaultRentPerBag(parseFloat(rentPerBag));

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="⚙️ Settings" subtitle="Configure system settings" onBackClick={onBack} />
        <div className="flex justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="⚙️ Settings" subtitle="Configure system settings" onBackClick={onBack} />

      <main className="max-w-2xl mx-auto p-4 pb-20">
        {saved && (
          <div className="bg-green-100 border-2 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ Settings saved successfully!
          </div>
        )}

        {/* Storage Settings */}
        <Card title="📦 Storage Configuration" className="mb-6">
          <Input
            label="Cold Storage Name"
            placeholder="Enter cold storage name"
            value={storageName}
            onChange={(e) => setStorageNameState(e.target.value)}
            required
          />
          <Input
            label="Total Storage Capacity (Bags)"
            type="number"
            value={storageCapacity}
            onChange={(e) => setStorageCapacityState(e.target.value)}
            placeholder="Enter total storage capacity"
            min="1"
          />
          <p className="text-gray-600 text-sm mb-4">
            Set the name and maximum number of bags your cold storage can hold.
          </p>
        </Card>

        {/* Rent Settings */}
        <Card title="💰 Rent Configuration" className="mb-6">
          <Input
            label="Default Rent per Bag (₹)"
            type="number"
            value={rentPerBag}
            onChange={(e) => setRentPerBagState(e.target.value)}
            placeholder="Enter default rent per bag"
            min="0"
            step="0.01"
          />
          <p className="text-gray-600 text-sm mb-4">
            This is the default rent per bag for new seasons. You can override this for specific seasons.
          </p>
        </Card>

        {/* Summary */}
        <Card title="📊 Current Configuration" className="mb-6 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Storage Name:</span>
              <span className="text-lg font-bold text-blue-600">{storageName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total Storage Capacity:</span>
              <span className="text-lg font-bold text-blue-600">{storageCapacity} bags</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Default Rent per Bag:</span>
              <span className="text-lg font-bold text-blue-600">₹{rentPerBag}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="success"
            size="lg"
            onClick={handleSaveSettings}
            className="flex-1 md:flex-none"
          >
            💾 Save Settings
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onBack}
            className="flex-1 md:flex-none"
          >
            ← Go Back
          </Button>
          {onLogout && (
            <Button
              variant="danger"
              size="lg"
              onClick={onLogout}
              className="flex-1 md:flex-none"
            >
              🔒 Logout
            </Button>
          )}
        </div>

        {/* Help Section */}
        <Card title="❓ Help" className="mt-8">
          <div className="space-y-3 text-gray-700 text-sm md:text-base">
            <div>
              <h4 className="font-bold mb-1">📦 Storage Capacity</h4>
              <p>
                The total number of bags your cold storage can hold. This is used to calculate
                available capacity on the dashboard.
              </p>
            </div>
            <div className="mt-4">
              <h4 className="font-bold mb-1">💰 Rent per Bag</h4>
              <p>
                The default rent charge per bag. When you add a new season, this value will be
                pre-filled. You can still change it for individual seasons.
              </p>
            </div>
            <div className="mt-4">
              <h4 className="font-bold mb-1">🧮 How Rent is Calculated</h4>
              <p>
                Total Rent = Total Deposited Bags × Rent per Bag. This rent is calculated on the
                deposited bags, not on the bags actually stored.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};
