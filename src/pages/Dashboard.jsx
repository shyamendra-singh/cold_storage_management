import React, { useState, useEffect, useCallback } from 'react';
import { Header, Card, Modal, LoadingSpinner, Select, Input, Button } from '../components/commonComponents';
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
  addSeason,
  updateSeason,
  addTransaction,
  getAllSessions,
  addGlobalSession,
  updateGlobalSession,
  deleteGlobalSession,
  updateSessionForFarmers,
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
import { getFarmerAddress, normalizeFarmerForForm } from '../utils/farmerUtils';

export const Dashboard = ({ onSelectFarmer, onNavigateToSettings, onLogout }) => {
  const [farmers, setFarmers] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ targetSessionId: '' });
  const [transferringSession, setTransferringSession] = useState(null);
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
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({ sessionName: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSession, setDeletingSession] = useState(null);
  const [deleteAction, setDeleteAction] = useState('transfer');
  const [targetSessionForDelete, setTargetSessionForDelete] = useState('');
  const [showAddSession, setShowAddSession] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const fetchedSessions = await getAllSessions();
      setSessions(fetchedSessions);
      if (!selectedSession) {
        if (fetchedSessions.length > 0) {
          setSelectedSession(fetchedSessions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [selectedSession]);

  useEffect(() => {
    loadSessions();
    loadFarmers();
  }, [loadSessions]);

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

          return { ...normalizeFarmerForForm(farmer), seasons, remainingBags };
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

  const filterFarmers = useCallback((farmersList, searchTerm = '') => {
    const query = searchTerm.trim().toLowerCase();

    return farmersList.filter((farmer) => {
      const matchesSearch =
        !query ||
        farmer.name.toLowerCase().includes(query) ||
        getFarmerAddress(farmer).toLowerCase().includes(query);

      if (!selectedSession) {
        return matchesSearch;
      }

      const matchesSession = farmer.seasons?.some((season) =>
        season.sessionId === selectedSession.id
      );
      return matchesSearch && matchesSession;
    });
  }, [selectedSession]);

  const handleSearch = (searchTerm) => {
    setFilteredFarmers(filterFarmers(farmers, searchTerm));
  };

  useEffect(() => {
    setFilteredFarmers(filterFarmers(farmers));
  }, [selectedSession, farmers, filterFarmers]);

  const handleSaveSession = async () => {
    if (!sessionForm.sessionName.trim()) {
      alert('Please enter session name');
      return;
    }

    try {
      setFormLoading(true);
      if (editingSession) {
        await updateGlobalSession(editingSession.id, {
          sessionName: sessionForm.sessionName,
        });
      } else {
        await addGlobalSession({
          sessionName: sessionForm.sessionName,
        });
      }

      setEditingSession(null);
      setSessionForm({ sessionName: '' });
      setShowAddSession(false);
      await loadSessions();
      await loadFarmers();
    } catch (err) {
      alert('Error saving session: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({ sessionName: session.sessionName });
    setShowAddSession(true);
  };

  const handleDeleteSession = (session) => {
    setDeletingSession(session);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteSession = async () => {
    if (!deletingSession) return;

    try {
      setFormLoading(true);
      if (deleteAction === 'transfer') {
        if (!targetSessionForDelete) {
          alert('Please select a target session');
          return;
        }
        await updateSessionForFarmers(deletingSession.id, targetSessionForDelete);
      } else if (deleteAction === 'delete') {
        // Find farmers with seasons in this session
        const farmersToDelete = farmers.filter(farmer =>
          farmer.seasons?.some(season => season.sessionId === deletingSession.id)
        );
        await Promise.all(farmersToDelete.map(farmer => deleteFarmer(farmer.id)));
      }

      await deleteGlobalSession(deletingSession.id);
      setShowDeleteModal(false);
      setDeletingSession(null);
      setTargetSessionForDelete('');
      await loadSessions();
      await loadFarmers();
      // If selectedSession was the deleted one, set to first available
      if (selectedSession?.id === deletingSession.id) {
        const remainingSessions = sessions.filter(s => s.id !== deletingSession.id);
        setSelectedSession(remainingSessions.length > 0 ? remainingSessions[0] : null);
      }
    } catch (err) {
      alert('Error deleting session: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleTransferFarmers = async () => {
    if (!transferForm.targetSessionId || !transferringSession) return;

    try {
      setFormLoading(true);
      await updateSessionForFarmers(transferringSession.id, transferForm.targetSessionId);
      setShowTransferModal(false);
      setTransferringSession(null);
      setTransferForm({ targetSessionId: '' });
      await loadFarmers();
    } catch (err) {
      alert('Error transferring farmers: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddFarmer = async (formData) => {
    try {
      setFormLoading(true);
      const farmerId = await addFarmer({
        name: formData.name,
        fatherName: formData.fatherName,
        address: formData.address?.trim() || '',
        phone: formData.phone,
        createdAt: new Date(),
      });

      const currentSessions = await getAllSessions();
      setSessions(currentSessions);
      const session = currentSessions.find((sessionItem) => sessionItem.id === formData.sessionId);
      if (!session) {
        alert('Selected session not found. Please try again.');
        return;
      }

      const seasonId = await addSeason(farmerId, {
        seasonName: session.sessionName || 'Session',
        rentPerBag: session.rentPerBag || getDefaultRentPerBag(),
        sessionId: session.id,
        createdAt: new Date(),
      });

      if (parseInt(formData.initialBags, 10) > 0) {
        await addTransaction(farmerId, seasonId, {
          type: 'deposit',
          bags: parseInt(formData.initialBags, 10),
          note: 'Initial deposit',
        });
      }

      await loadFarmers();
      if (session) {
        setSelectedSession(session);
      }
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
    const season = farmer.seasons?.[0];
    setEditingFarmer({
      ...farmer,
      sessionId: season?.sessionId || '',
      seasonId: season?.id || season?.season || '',
    });
    setShowEditForm(true);
  };

  const handleUpdateFarmer = async (updatedData) => {
    if (!editingFarmer) return;
    try {
      setEditLoading(true);
      await updateFarmer(editingFarmer.id, {
        name: updatedData.name,
        fatherName: updatedData.fatherName,
        address: updatedData.address?.trim() || '',
        phone: updatedData.phone || '',
        village: '',
        post: '',
      });
      // Update the season's sessionId if changed
      if (
        editingFarmer.seasonId &&
        updatedData.sessionId !== editingFarmer.sessionId
      ) {
        await updateSeason(editingFarmer.id, editingFarmer.seasonId, {
          sessionId: updatedData.sessionId,
        });
      }
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
              address: getFarmerAddress(farmer) || '-',
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
        subtitle="Sahawar-Etah Road, Farauli, Sahawar, Kasganj, U.P."
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

        {/* Sessions Section */}
        <Card title="Sessions" className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                selectedSession === null
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Sessions
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-gray-800">{session.sessionName}</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditSession(session)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      aria-label="Edit Session"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      aria-label="Delete Session"
                    >
                      🗑️
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferringSession(session);
                        setShowTransferModal(true);
                      }}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      aria-label="Transfer Farmers"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSession(session)}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-500 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  View Farmers
                </button>
              </Card>
            ))}
          </div>
          <button
            onClick={() => {
              setEditingSession(null);
              setSessionForm({ sessionName: '' });
              setShowAddSession(true);
            }}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-lg transition text-sm md:text-base"
          >
            ➕ Add Session
          </button>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowAddForm(true)}
            disabled={sessions.length === 0}
            className={`font-bold px-4 md:px-6 py-3 rounded-lg transition text-sm md:text-base ${
              sessions.length === 0
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
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
          <AddFarmerForm
            onSubmit={handleAddFarmer}
            loading={formLoading}
            sessionOptions={sessions.map((session) => ({
              value: session.id,
              label: session.sessionName,
            }))}
          />
        </Modal>

        {/* Add Session Modal */}
        <Modal
          isOpen={showAddSession}
          title={editingSession ? 'Edit Session' : 'Add Session'}
          onClose={() => {
            setShowAddSession(false);
            setEditingSession(null);
          }}
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveSession(); }}>
            <Input
              label="Session Name"
              placeholder="Enter session name"
              value={sessionForm.sessionName}
              onChange={(e) => setSessionForm({ ...sessionForm, sessionName: e.target.value })}
              required
            />
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="lg" onClick={() => {
                setShowAddSession(false);
                setEditingSession(null);
              }} className="!w-full">
                Cancel
              </Button>
              <Button variant="success" size="lg" type="submit" className="!w-full" disabled={formLoading}>
                {formLoading ? 'Saving...' : editingSession ? 'Update Session' : 'Save Session'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Transfer Farmers Modal */}
        <Modal
          isOpen={showTransferModal}
          title={`Transfer Farmers from ${transferringSession?.sessionName}`}
          onClose={() => setShowTransferModal(false)}
        >
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleTransferFarmers(); }}>
            <Select
              label="Target Session"
              options={sessions.filter(s => s.id !== transferringSession?.id).map(s => ({ value: s.id, label: s.sessionName }))}
              value={transferForm.targetSessionId}
              onChange={(e) => setTransferForm({ targetSessionId: e.target.value })}
              required
            />
            <Button variant="success" size="lg" type="submit" className="!w-full" disabled={formLoading}>
              {formLoading ? 'Transferring...' : 'Transfer Farmers'}
            </Button>
          </form>
        </Modal>

        {/* Delete Session Modal */}
        <Modal
          isOpen={showDeleteModal}
          title={`Delete Session: ${deletingSession?.sessionName}`}
          onClose={() => setShowDeleteModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-700">What would you like to do with the farmers in this session?</p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deleteAction"
                  value="transfer"
                  checked={deleteAction === 'transfer'}
                  onChange={(e) => setDeleteAction(e.target.value)}
                  className="mr-2"
                />
                Transfer farmers to another session
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="deleteAction"
                  value="delete"
                  checked={deleteAction === 'delete'}
                  onChange={(e) => setDeleteAction(e.target.value)}
                  className="mr-2"
                />
                Delete all farmers completely
              </label>
            </div>
            {deleteAction === 'transfer' && (
              <Select
                label="Target Session"
                options={sessions.filter(s => s.id !== deletingSession?.id).map(s => ({ value: s.id, label: s.sessionName }))}
                value={targetSessionForDelete}
                onChange={(e) => setTargetSessionForDelete(e.target.value)}
                required
              />
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" size="lg" onClick={() => setShowDeleteModal(false)} className="!w-full">
                Cancel
              </Button>
              <Button variant="danger" size="lg" onClick={handleConfirmDeleteSession} className="!w-full" disabled={formLoading}>
                {formLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
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
            sessionOptions={sessions.map((session) => ({
              value: session.id,
              label: session.sessionName,
            }))}
            isEditing
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm mb-2">Developed by Shyamendra Singh</p>
          <div className="flex justify-center space-x-6">
            <a
              href="mailto:shyamendratomar736@gmail.com"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              📧 Email
            </a>
            <a
              href="tel:+917302886011"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              📞 Call
            </a>
            <a
              href="https://www.linkedin.com/in/shyamendrasingh/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              💼 LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
