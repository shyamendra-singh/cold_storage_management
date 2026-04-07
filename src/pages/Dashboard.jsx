import React, { useState, useEffect } from 'react';
import { Header, Card, Modal, LoadingSpinner, Select } from '../components/commonComponents';
import {
  FarmerSearch,
  FarmerCard,
  AddFarmerForm,
  FarmerForm,
  FarmerStats,
} from '../components/farmerComponents';
import {
  getAllFarmers,
  addFarmer,
  deleteFarmer,
  getAllFarmerTransactions,
  updateFarmer,
} from '../utils/firebaseService';
import {
  exportToExcel,
  printLedgerVector,
  exportAllFarmerLedgersExcel,
  printAllFarmerLedgersPDF,
} from '../utils/exportUtils';
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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportForm, setExportForm] = useState({
    farmerId: 'ALL',
    from: '',
    to: '',
    format: 'pdf',
  });
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

      const farmersWithStats = await Promise.all(
        fetchedFarmers.map(async (farmer) => {
          const seasons = await getAllFarmerTransactions(farmer.id);
          const remainingBags = seasons.reduce((sum, seasonData) => {
            const stats = calculateFarmerStats(seasonData.transactions);
            return sum + stats.remainingBags;
          }, 0);

          return { ...farmer, remainingBags };
        })
      );

      setFarmers(farmersWithStats);
      setFilteredFarmers(farmersWithStats);

      const totalBags = farmersWithStats.reduce(
        (sum, farmer) => sum + farmer.remainingBags,
        0
      );
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

  const handleEditFarmer = (farmer) => {
    setEditingFarmer(farmer);
    setShowEditForm(true);
  };

  const handleUpdateFarmer = async (updatedData) => {
    if (!editingFarmer) return;
    try {
      setEditLoading(true);
      await updateFarmer(editingFarmer.id, updatedData);
      setShowEditForm(false);
      setEditingFarmer(null);
      await loadFarmers();
    } catch (err) {
      alert('Error updating farmer: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleExportChange = (e) => {
    const { name, value } = e.target;
    setExportForm((prev) => ({ ...prev, [name]: value }));
  };

  const toJsDate = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return new Date(value);
    if (value && typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
  };

  const filterByRange = (transactions, from, to) => {
    if (!from && !to) return transactions;
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    return transactions.filter((tx) => {
      const txDate = toJsDate(tx.date);
      if (!txDate || Number.isNaN(txDate.getTime())) return false;
      if (fromDate && txDate < fromDate) return false;
      if (toDate && txDate > toDate) return false;
      return true;
    });
  };

  const handleExportLedger = async (e) => {
    e.preventDefault();

    try {
      const selectedFarmerId = exportForm.farmerId;
      const isAll = selectedFarmerId === 'ALL';
      const filteredFrom = exportForm.from;
      const filteredTo = exportForm.to;

      if (isAll) {
        const exportRows = await Promise.all(
          farmers.map(async (farmer) => {
            const seasons = await getAllFarmerTransactions(farmer.id);
            const allFilteredTransactions = seasons.flatMap((season) =>
              filterByRange(season.transactions, filteredFrom, filteredTo)
            );
            const stats = calculateFarmerStats(allFilteredTransactions);
            const totalRent = seasons.reduce((sum, season) => {
              const seasonTransactions = filterByRange(season.transactions, filteredFrom, filteredTo);
              const seasonStats = calculateFarmerStats(seasonTransactions);
              return sum + seasonStats.totalDeposited * (season.rentPerBag || getDefaultRentPerBag());
            }, 0);
            const balanceAmount = parseFloat((totalRent - stats.totalPaid).toFixed(2));

            return {
              farmerName: farmer.name || 'Unnamed Farmer',
              fatherName: farmer.fatherName || '-',
              village: farmer.village || '-',
              totalDeposited: stats.totalDeposited,
              totalWithdrawn: stats.totalWithdrawn,
              remainingBags: stats.remainingBags,
              totalRent,
              totalPaid: stats.totalPaid,
              balanceAmount,
            };
          })
        );

        if (exportForm.format === 'excel') {
          exportAllFarmerLedgersExcel(exportRows);
        } else {
          printAllFarmerLedgersPDF(exportRows);
        }
      } else {
        const farmer = farmers.find((f) => f.id === selectedFarmerId);
        if (!farmer) {
          alert('Selected farmer not found.');
          return;
        }

        const seasons = await getAllFarmerTransactions(farmer.id);
        for (const season of seasons) {
          const transactions = filterByRange(season.transactions, filteredFrom, filteredTo);
          const stats = calculateFarmerStats(transactions);
          if (exportForm.format === 'excel') {
            exportToExcel(farmer.name || 'Farmer', season.seasonName || 'Season', transactions, stats, season.rentPerBag || getDefaultRentPerBag());
          } else {
            printLedgerVector(farmer.name || 'Farmer', season.seasonName || 'Season', transactions, stats, season.rentPerBag || getDefaultRentPerBag());
          }
        }
      }
    } catch (error) {
      console.error('Export failed', error);
      alert('Export failed. Please try again.');
    } finally {
      setShowExportModal(false);
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
            onClick={() => setShowExportModal(true)}
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-4 md:px-6 py-3 rounded-lg transition text-sm md:text-base"
          >
            📤 Export Ledger
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredFarmers.map((farmer) => (
                <FarmerCard
                  key={farmer.id}
                  farmer={farmer}
                  onSelect={(f) => onSelectFarmer(f)}
                  onEdit={handleEditFarmer}
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

        {/* Edit Farmer Modal */}
        <Modal
          isOpen={showEditForm}
          title="Edit Farmer"
          onClose={() => setShowEditForm(false)}
        >
          <FarmerForm
            initialData={editingFarmer || {}}
            onSubmit={handleUpdateFarmer}
            loading={editLoading}
            submitLabel="Save Changes"
          />
        </Modal>

        {/* Export Ledger Modal */}
        <Modal
          isOpen={showExportModal}
          title="Export Ledger"
          onClose={() => setShowExportModal(false)}
        >
          <form onSubmit={handleExportLedger} className="space-y-4">
            <Select
              label="Select Farmer"
              name="farmerId"
              value={exportForm.farmerId}
              onChange={handleExportChange}
              options={
                [{ value: 'ALL', label: 'ALL FARMERS' }].concat(
                  farmers.map((farmer) => ({
                    value: farmer.id,
                    label: farmer.name || 'Unnamed Farmer',
                  }))
                )
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">From</label>
                <input
                  type="date"
                  name="from"
                  value={exportForm.from}
                  onChange={handleExportChange}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-blue-600 transition border-gray-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">To</label>
                <input
                  type="date"
                  name="to"
                  value={exportForm.to}
                  onChange={handleExportChange}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-blue-600 transition border-gray-300"
                />
              </div>
            </div>
            <Select
              label="Format"
              name="format"
              value={exportForm.format}
              onChange={handleExportChange}
              options={[
                { value: 'pdf', label: 'PDF' },
                { value: 'excel', label: 'Excel' },
              ]}
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-lg transition"
            >
              Export
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
};
