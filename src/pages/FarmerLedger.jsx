import React, { useState, useEffect, useCallback } from 'react';
import { Header, Card, Modal, Button, Input, LoadingSpinner } from '../components/commonComponents';
import {
  TransactionForm,
  TransactionList,
  LedgerSummary,
} from '../components/transactionComponents';
import {
  getSeasons,
  addSeason,
  deleteSeason,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from '../utils/firebaseService';
import { calculateFarmerStats, getDefaultRentPerBag } from '../utils/calculations';
import { exportToExcel, printLedger } from '../utils/exportUtils';

export const FarmerLedger = ({ farmer, onBack, onLogout }) => {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSeason, setShowAddSeason] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [seasonForm, setSeasonForm] = useState({ seasonName: '', rentPerBag: getDefaultRentPerBag() });
  const [error, setError] = useState(null);

  const loadSeasons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSeasons = await getSeasons(farmer.id);
      setSeasons(fetchedSeasons);
      if (fetchedSeasons.length > 0) {
        setSelectedSeason(fetchedSeasons[0]);
      }
    } catch (err) {
      setError('Failed to load seasons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [farmer.id]);

  const loadTransactions = useCallback(async (seasonId) => {
    try {
      const fetchedTransactions = await getTransactions(farmer.id, seasonId);
      setTransactions(fetchedTransactions);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  }, [farmer.id]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  useEffect(() => {
    if (selectedSeason) {
      loadTransactions(selectedSeason.id);
    }
  }, [selectedSeason, loadTransactions]);

  const handleAddSeason = async () => {
    if (!seasonForm.seasonName.trim()) {
      alert('Please enter season name');
      return;
    }

    try {
      setFormLoading(true);
      await addSeason(farmer.id, {
        seasonName: seasonForm.seasonName,
        rentPerBag: parseFloat(seasonForm.rentPerBag),
      });
      setSeasonForm({ seasonName: '', rentPerBag: getDefaultRentPerBag() });
      setShowAddSeason(false);
      await loadSeasons();
    } catch (err) {
      alert('Error adding season: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    if (window.confirm('Delete this season and all its transactions?')) {
      try {
        await deleteSeason(farmer.id, seasonId);
        setSelectedSeason(null);
        await loadSeasons();
      } catch (err) {
        alert('Error deleting season: ' + err.message);
      }
    }
  };

  const handleAddTransaction = async (formData) => {
    if (!selectedSeason) {
      alert('Please select a season first');
      return;
    }

    try {
      setFormLoading(true);
      if (editingTransaction) {
        await updateTransaction(farmer.id, selectedSeason.id, editingTransaction.id, formData);
        setEditingTransaction(null);
      } else {
        await addTransaction(farmer.id, selectedSeason.id, formData);
      }
      setShowAddTransaction(false);
      await loadTransactions(selectedSeason.id);
    } catch (err) {
      alert('Error saving transaction: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await deleteTransaction(farmer.id, selectedSeason.id, transactionId);
        await loadTransactions(selectedSeason.id);
      } catch (err) {
        alert('Error deleting transaction: ' + err.message);
      }
    }
  };

  const handleExport = () => {
    if (!selectedSeason) {
      alert('Please select a season first');
      return;
    }
    const stats = calculateFarmerStats(transactions);
    exportToExcel(
      farmer.name,
      selectedSeason.seasonName,
      transactions,
      stats,
      selectedSeason.rentPerBag
    );
  };

  const handlePrint = () => {
    if (!selectedSeason) {
      alert('Please select a season first');
      return;
    }
    const stats = calculateFarmerStats(transactions);
    printLedger(
      farmer.name,
      selectedSeason.seasonName,
      transactions,
      stats,
      selectedSeason.rentPerBag
    );
  };

  const farmerStats = selectedSeason ? calculateFarmerStats(transactions) : {};

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        title={`👨‍🌾 ${farmer.name}'s Ledger`}
        subtitle={selectedSeason ? `Season: ${selectedSeason.seasonName}` : 'Select a season'}
        onBackClick={onBack}
      />

      <main className="max-w-6xl mx-auto p-4 pb-20">
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Seasons Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <Card title="Seasons">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <div>
                  {seasons.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">📭 No seasons yet</p>
                  ) : (
                    <div className="space-y-3">
                      {seasons.map((season) => (
                        <div
                          key={season.id}
                          className={`p-3 rounded-lg cursor-pointer transition ${
                            selectedSeason?.id === season.id
                              ? 'bg-blue-500 text-white border-2 border-blue-600'
                              : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSeason(season)}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <p className="font-bold">{season.seasonName}</p>
                              <p className="text-sm opacity-90">₹{season.rentPerBag}/bag</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSeason(season.id);
                              }}
                              className="text-sm text-red-600 hover:text-red-800 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => setShowAddSeason(true)}
                    className="!w-full mt-4"
                  >
                    ➕ Add Season
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedSeason ? (
              <>
                {/* Summary */}
                <div className="mb-6">
                  <LedgerSummary
                    stats={farmerStats}
                    rentPerBag={selectedSeason.rentPerBag}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingTransaction(null);
                      setShowAddTransaction(true);
                    }}
                    className="flex-1 md:flex-none"
                  >
                    ➕ Add Transaction
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExport}
                    className="flex-1 md:flex-none"
                  >
                    📊 Export Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="flex-1 md:flex-none"
                  >
                    🖨️ Print
                  </Button>
                  {onLogout && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={onLogout}
                      className="flex-1 md:flex-none"
                    >
                      🔒 Logout
                    </Button>
                  )}
                </div>

                {/* Transactions */}
                <Card title="Transactions">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <TransactionList
                      transactions={transactions}
                      onEdit={(tx) => {
                        setEditingTransaction(tx);
                        setShowAddTransaction(true);
                      }}
                      onDelete={handleDeleteTransaction}
                    />
                  )}
                </Card>
              </>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <p className="text-gray-600 text-xl">👆 Select a season to view transactions</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Add Season Modal */}
        <Modal
          isOpen={showAddSeason}
          title="Add New Season"
          onClose={() => setShowAddSeason(false)}
          onSubmit={handleAddSeason}
          submitText={formLoading ? 'Adding...' : 'Add Season'}
        >
          <Input
            label="Season Name *"
            placeholder="e.g., 2025-26"
            value={seasonForm.seasonName}
            onChange={(e) => setSeasonForm({ ...seasonForm, seasonName: e.target.value })}
            required
          />
          <Input
            label="Rent per Bag (₹) *"
            type="number"
            placeholder="Enter rent per bag"
            value={seasonForm.rentPerBag}
            onChange={(e) =>
              setSeasonForm({ ...seasonForm, rentPerBag: e.target.value })
            }
            required
            min="0"
            step="0.01"
          />
        </Modal>

        {/* Add/Edit Transaction Modal */}
        <Modal
          isOpen={showAddTransaction}
          title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          onClose={() => {
            setShowAddTransaction(false);
            setEditingTransaction(null);
          }}
        >
          <TransactionForm
            onSubmit={handleAddTransaction}
            loading={formLoading}
            editingTransaction={editingTransaction}
          />
        </Modal>
      </main>
    </div>
  );
};
