import React, { forwardRef } from 'react';

/**
 * Header Component
 * Reusable header for all pages
 */
export const Header = ({ title, subtitle, onBackClick }) => {
  return (
    <header className="bg-blue-600 text-white p-4 sticky top-0 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded text-sm md:text-base transition"
            aria-label="Go back"
          >
            ← Back
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-blue-100 text-sm md:text-base">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
};

/**
 * Card Component
 * Reusable card for displaying content
 */
export const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 md:p-6 ${className}`}>
      {title && <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-800">{title}</h2>}
      {children}
    </div>
  );
};

/**
 * Button Component
 * Reusable button with different variants
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded transition duration-200 focus:outline-none focus:ring-2';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300 disabled:bg-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 disabled:bg-gray-400',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 disabled:bg-gray-400',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-800 focus:ring-gray-200 disabled:bg-gray-200',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-300 disabled:border-gray-400 disabled:text-gray-400',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg w-full md:w-auto',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Input Component
 * Reusable input field
 */
export const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-gray-700 font-medium mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-blue-600 transition ${
          error ? 'border-red-600' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
});

/**
 * TextArea Component
 * Reusable textarea field
 */
export const TextArea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-gray-700 font-medium mb-2">{label}</label>}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-blue-600 transition ${
          error ? 'border-red-600' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

/**
 * Select Component
 * Reusable select dropdown
 */
export const Select = ({
  label,
  options = [],
  value,
  onChange,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-gray-700 font-medium mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-blue-600 transition ${
          error ? 'border-red-600' : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

/**
 * Modal Component
 * Reusable modal dialog
 */
export const Modal = ({ isOpen, title, children, onClose, onSubmit, submitText = 'Submit' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-lg shadow-lg max-w-md w-full md:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b flex justify-between items-center p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="p-4 md:p-6">
          {children}
          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              size="lg"
              onClick={onClose}
              className="!w-full"
            >
              Cancel
            </Button>
            {onSubmit && (
              <Button variant="primary" size="lg" onClick={onSubmit} className="!w-full">
                {submitText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading Spinner
 */
export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

/**
 * Empty State
 */
export const EmptyState = ({ message, icon = '📭' }) => {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
};

/**
 * Stat Card
 * For displaying statistics
 */
export const StatCard = ({ label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  };

  const textClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div className={`border-2 rounded-lg p-4 md:p-6 ${colorClasses[color]}`}>
      <p className="text-gray-600 text-sm md:text-base font-medium">{label}</p>
      <p className={`text-2xl md:text-3xl font-bold ${textClasses[color]} mt-2`}>{value}</p>
    </div>
  );
};
