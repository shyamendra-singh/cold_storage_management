import React, { useState, useEffect, useCallback } from 'react';
import { Header, Card, Modal, Button, LoadingSpinner } from '../components/commonComponents';
import {
  TransactionForm,
  TransactionList,
  LedgerSummary,
} from '../components/transactionComponents';
import {
  getSeasons,
  addSeason,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getAllSessions,
} from '../utils/firebaseService';
import { calculateFarmerStats } from '../utils/calculations';
import { exportToExcel, printLedger } from '../utils/exportUtils';

export const FarmerLedger = ({ farmer, onBack, onLogout }) => {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedGlobalSessionId, setSelectedGlobalSessionId] = useState('');
  const [globalSessions, setGlobalSessions] = useState([]);
  const [targetSessionId, setTargetSessionId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSeasons = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSeasons = await getSeasons(farmer.id);
      const filteredSeasons = fetchedSeasons.filter(season => season.sessionId === sessionId);
      setSeasons(filteredSeasons);
      if (filteredSeasons.length > 0) {
        setSelectedSeason(filteredSeasons[0]);
      } else {
        setSelectedSeason(null);
        setTransactions([]);
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
    const loadGlobalSessions = async () => {
      try {
        const sessions = await getAllSessions();
        setGlobalSessions(sessions);
        if (sessions.length > 0 && !selectedGlobalSessionId) {
          setSelectedGlobalSessionId(sessions[0].id);
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
      }
    };

    loadGlobalSessions();
  }, [selectedGlobalSessionId]);

  useEffect(() => {
    if (selectedGlobalSessionId) {
      loadSeasons(selectedGlobalSessionId);
    }
  }, [selectedGlobalSessionId, loadSeasons]);

  useEffect(() => {
    if (selectedSeason && selectedSeason.id) {
      loadTransactions(selectedSeason.id);
    } else if (selectedSeason && !selectedSeason.id) {
      setTransactions([]);
    }
  }, [selectedSeason, loadTransactions]);

  const handleSelectGlobalSession = (session) => {
    setSelectedGlobalSessionId(session.id);
    // loadSeasons will be called via useEffect
  };

  const handleTransferToSession = async () => {
    if (!selectedSeason) {
      alert('Please select a season to transfer.');
      return;
    }

    if (!targetSessionId) {
      alert('Please choose a target session.');
      return;
    }

    if (selectedSeason.sessionId === targetSessionId) {
      alert('Farmer is already in the selected session.');
      return;
    }

    const targetSession = globalSessions.find((session) => session.id === targetSessionId);
    if (!targetSession) {
      alert('Selected session not found.');
      return;
    }

    const alreadyHasSession = seasons.some(
      (season) => season.sessionId === targetSessionId
    );
    if (alreadyHasSession) {
      alert('This farmer already has a season for the chosen session.');
      return;
    }

    try {
      setFormLoading(true);
      const newSeasonId = await addSeason(farmer.id, {
        seasonName: targetSession.sessionName,
        rentPerBag: targetSession.rentPerBag,
        sessionId: targetSession.id,
      });
      await loadSeasons();
      setSelectedSeason({
        id: newSeasonId,
        seasonName: targetSession.sessionName,
        rentPerBag: targetSession.rentPerBag,
        sessionId: targetSession.id,
      });
      alert('Farmer transferred to new session successfully.');
    } catch (err) {
      alert('Error transferring session: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddTransaction = async (formData) => {
    if (!selectedSeason || !selectedSeason.id) {
      alert('Please select a farmer session with data first');
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
    if (!selectedSeason || !selectedSeason.id) {
      alert('Please select a farmer session with data first');
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
    if (!selectedSeason || !selectedSeason.id) {
      alert('Please select a farmer session with data first');
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
                  {globalSessions.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">📭 No sessions available</p>
                  ) : (
                    <div className="space-y-3">
                      {globalSessions.map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => handleSelectGlobalSession(session)}
                          className={`w-full text-left p-3 rounded-lg transition ${
                            selectedGlobalSessionId === session.id
                              ? 'bg-blue-500 text-white border-2 border-blue-600'
                              : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-3">
                            <p className="font-bold">{session.sessionName}</p>
                            {seasons.some((season) => season.sessionId === session.id) ? (
                              <span className="text-xs text-green-700 bg-green-100 rounded-full px-2 py-1">
                                Session data available
                              </span>
                            ) : (
                              <span className="text-xs text-gray-700 bg-gray-100 rounded-full px-2 py-1">
                                No data
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Transfer Farmer Session</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Target Session
                      </label>
                      <select
                        value={targetSessionId}
                        onChange={(e) => setTargetSessionId(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-600 transition border-gray-300"
                      >
                        <option value="">Choose a session</option>
                        {globalSessions
                          .filter((session) => session.id !== selectedSeason?.sessionId)
                          .map((session) => (
                            <option key={session.id} value={session.id}>
                              {session.sessionName} ({session.rentPerBag}/bag)
                            </option>
                          ))}
                      </select>
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleTransferToSession}
                      className="flex-1 md:flex-none"
                    >
                      🔁 Transfer Session
                    </Button>
                  </div>
                </div>
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
