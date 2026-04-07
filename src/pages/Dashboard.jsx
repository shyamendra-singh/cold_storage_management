import React, { useState, useEffect } from 'react';
import { Header, Card, Modal, LoadingSpinner } from '../components/commonComponents';
import {
  FarmerSearch,
  FarmerCard,
  AddFarmerForm,
  FarmerStats,
} from '../components/farmerComponents';
import {
  getAllFarmers,
  addFarmer,
  deleteFarmer,
  getAllFarmerTransactions,
} from '../utils/firebaseService';
import {
  calculateFarmerStats,
  getStorageCapacity,
  getDefaultRentPerBag,
  getStorageName,
} from '../utils/calculations';

export const Dashboard = ({ onSelectFarmer, onNavigateToSettings, onLogout }) => {
  const [farmers, setFarmers] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalUsed, setTotalUsed] = useState(0);

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFarmers = await getAllFarmers();
      setFarmers(fetchedFarmers);
      setFilteredFarmers(fetchedFarmers);

      // Calculate total bags used
      let totalBags = 0;
      for (const farmer of fetchedFarmers) {
        const transactions = await getAllFarmerTransactions(farmer.id);
        for (const seasonData of transactions) {
          const stats = calculateFarmerStats(seasonData.transactions);
          totalBags += stats.remainingBags;
        }
      }
      setTotalUsed(totalBags);
    } catch (err) {
      setError('Failed to load farmers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredFarmers(farmers);
    } else {
      const filtered = farmers.filter((farmer) =>
        farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFarmers(filtered);
    }
  };

  const handleAddFarmer = async (formData) => {
    try {
      setFormLoading(true);
      await addFarmer(formData);
      setShowAddForm(false);
      await loadFarmers();
    } catch (err) {
      alert('Error adding farmer: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFarmer = async (farmerId) => {
    if (window.confirm('Are you sure you want to delete this farmer?')) {
      try {
        await deleteFarmer(farmerId);
        await loadFarmers();
      } catch (err) {
        alert('Error deleting farmer: ' + err.message);
      }
    }
  };

  const totalCapacity = getStorageCapacity();
  const storageName = getStorageName();
  const stats = {
    totalFarmers: farmers.length,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        title={`${storageName}`}
        subtitle="Sahawar-Etah Road, Farauli, Sahawar, Kashganj, U.P."
      />

      <main className="max-w-6xl mx-auto p-4 pb-20">
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Stats Section */}
        <FarmerStats
          stats={stats}
          totalCapacity={totalCapacity}
          totalUsed={totalUsed}
          defaultRent={getDefaultRentPerBag()}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 md:px-6 py-3 rounded-lg transition text-sm md:text-base"
          >
            ➕ Add New Farmer
          </button>
          <button
            onClick={onNavigateToSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 md:px-6 py-3 rounded-lg transition text-sm md:text-base"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 md:px-6 py-3 rounded-lg transition text-sm md:text-base"
          >
            🔒 Logout
          </button>
        </div>

        {/* Search Section */}
        <Card title="Search Farmers">
          <FarmerSearch onSearch={handleSearch} />
        </Card>

        {/* Farmers List */}
        <Card title="All Farmers" className="mt-6">
          {loading ? (
            <LoadingSpinner />
          ) : filteredFarmers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">📭 No farmers found</p>
            </div>
          ) : (
            <div>
              {filteredFarmers.map((farmer) => (
                <FarmerCard
                  key={farmer.id}
                  farmer={farmer}
                  onSelect={(f) => onSelectFarmer(f)}
                  onDelete={handleDeleteFarmer}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Add Farmer Modal */}
        <Modal
          isOpen={showAddForm}
          title="Add New Farmer"
          onClose={() => setShowAddForm(false)}
        >
          <AddFarmerForm onSubmit={handleAddFarmer} loading={formLoading} />
        </Modal>
      </main>
    </div>
  );
};
