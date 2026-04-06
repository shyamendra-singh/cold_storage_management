import React, { useState } from 'react';
import { Input, Select, Button, TextArea, EmptyState } from './commonComponents';
import { formatDate, formatCurrency } from '../utils/calculations';

/**
 * TransactionForm Component
 * Form to add/edit transactions
 */
export const TransactionForm = ({ onSubmit, loading, editingTransaction = null }) => {
  const [formData, setFormData] = useState(
    editingTransaction || {
      type: 'deposit',
      bags: '',
      payment: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    }
  );
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Transaction type is required';
    }

    if (formData.type === 'deposit' || formData.type === 'withdrawal') {
      if (!formData.bags || parseInt(formData.bags) <= 0) {
        newErrors.bags = 'Number of bags must be greater than 0';
      }
    }

    if (formData.type === 'withdrawal' && formData.payment) {
      if (parseFloat(formData.payment) < 0) {
        newErrors.payment = 'Payment cannot be negative';
      }
    }

    if (formData.type === 'payment') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Payment amount must be greater than 0';
      }
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      if (!editingTransaction) {
        setFormData({
          type: 'deposit',
          bags: '',
          payment: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          note: '',
        });
      }
    }
  };

  const transactionTypes = [
    { value: 'deposit', label: 'Deposit (Add Bags)' },
    { value: 'withdrawal', label: 'Withdrawal (Remove Bags)' },
    { value: 'payment', label: 'Payment (Direct)' },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <Select
        label="Transaction Type *"
        options={transactionTypes}
        value={formData.type}
        onChange={(e) =>
          setFormData({
            ...formData,
            type: e.target.value,
            bags: '',
            payment: '',
            amount: '',
          })
        }
        error={errors.type}
        required
      />

      {(formData.type === 'deposit' || formData.type === 'withdrawal') && (
        <Input
          label={
            formData.type === 'deposit'
              ? 'Number of Bags to Deposit *'
              : 'Number of Bags to Withdraw *'
          }
          type="number"
          placeholder="Enter number of bags"
          value={formData.bags}
          onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
          error={errors.bags}
          required
          min="1"
        />
      )}

      {formData.type === 'withdrawal' && (
        <Input
          label="Payment (if any)"
          type="number"
          placeholder="Enter payment amount"
          value={formData.payment}
          onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
          error={errors.payment}
          min="0"
          step="0.01"
        />
      )}

      {formData.type === 'payment' && (
        <Input
          label="Payment Amount *"
          type="number"
          placeholder="Enter payment amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          error={errors.amount}
          required
          min="0.01"
          step="0.01"
        />
      )}

      <Input
        label="Date *"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        error={errors.date}
        required
      />

      <TextArea
        label="Notes (Optional)"
        placeholder="Add any notes"
        value={formData.note}
        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        rows="3"
      />

      <Button variant="success" size="lg" disabled={loading} className="!w-full">
        {loading ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Add Transaction'}
      </Button>
    </form>
  );
};

/**
 * TransactionList Component
 * Display list of transactions
 */
export const TransactionList = ({ transactions, onEdit, onDelete }) => {
  if (!transactions || transactions.length === 0) {
    return <EmptyState message="No transactions yet" icon="📋" />;
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="bg-white border-2 border-gray-200 rounded-lg p-4 flex justify-between items-start gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                {tx.type === 'deposit'
                  ? '📥 Deposit'
                  : tx.type === 'withdrawal'
                  ? '📤 Withdrawal'
                  : '💰 Payment'}
              </span>
              <span className="text-sm text-gray-600">{formatDate(tx.date)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {tx.bags && (
                <p className="text-gray-700">
                  <span className="font-medium">Bags:</span> {tx.bags}
                </p>
              )}
              {(tx.amount || tx.payment) && (
                <p className="text-gray-700">
                  <span className="font-medium">Amount:</span> {formatCurrency(tx.amount || tx.payment || 0)}
                </p>
              )}
              {tx.note && (
                <p className="col-span-2 text-gray-600">
                  <span className="font-medium">Note:</span> {tx.note}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onEdit(tx)}
              className="px-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded font-semibold text-sm transition"
              title="Edit transaction"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(tx.id)}
              className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded font-semibold text-sm transition"
              title="Delete transaction"
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * LedgerSummary Component
 * Display ledger summary statistics
 */
export const LedgerSummary = ({ stats = {}, rentPerBag = 0 }) => {
  const totalDeposited = parseInt(stats.totalDeposited) || 0;
  const totalWithdrawn = parseInt(stats.totalWithdrawn) || 0;
  const remainingBags = parseInt(stats.remainingBags) || 0;
  const totalPaid = parseFloat(stats.totalPaid) || 0;
  const rentPerBagNum = parseFloat(rentPerBag) || 0;
  
  const totalRent = totalDeposited * rentPerBagNum;
  const pendingAmount = parseFloat((totalRent - totalPaid).toFixed(2));
  const isPending = pendingAmount > 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Ledger Summary</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 font-medium">Total Deposited</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1">{totalDeposited} bags</p>
        </div>

        <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 font-medium">Total Withdrawn</p>
          <p className="text-xl md:text-2xl font-bold text-orange-600 mt-1">{totalWithdrawn} bags</p>
        </div>

        <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 font-medium">Remaining</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{remainingBags} bags</p>
        </div>

        <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 font-medium">Rent per Bag</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600 mt-1">₹{rentPerBagNum.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 font-medium">Total Rent</p>
          <p className="text-xl md:text-2xl font-bold text-indigo-600 mt-1">₹{totalRent.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 font-medium">Total Paid</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">₹{totalPaid.toFixed(2)}</p>
        </div>
      </div>

      <div
        className={`mt-4 p-4 rounded-lg ${
          isPending ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'
        }`}
      >
        <p className="text-sm font-medium text-gray-600">Pending Amount</p>
        <p
          className={`text-3xl font-bold mt-2 ${
            isPending ? 'text-red-600' : 'text-green-600'
          }`}
        >
          ₹{pendingAmount.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

/**
 * SeasonCard Component
 * Display season info
 */
export const SeasonCard = ({ season, farmer, onSelect, onDelete }) => {
  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">{season.seasonName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Rent per Bag:</span> ₹{season.rentPerBag}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSelect(season)}
          className="flex-1 md:flex-none"
        >
          View Transactions
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(season.id)}
          className="flex-1 md:flex-none"
        >
          Delete Season
        </Button>
      </div>
    </div>
  );
};
