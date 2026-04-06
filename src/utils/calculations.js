/**
 * Calculate farmer statistics dynamically
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} - Calculated statistics
 */
export const calculateFarmerStats = (transactions) => {
  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let totalPaid = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'deposit' && tx.bags) {
      totalDeposited += parseInt(tx.bags, 10) || 0;
    } else if (tx.type === 'withdrawal' && tx.bags) {
      totalWithdrawn += parseInt(tx.bags, 10) || 0;
    }

    if (tx.type === 'payment' && tx.amount) {
      totalPaid += parseFloat(tx.amount) || 0;
    } else if (tx.type === 'withdrawal' && tx.payment) {
      totalPaid += parseFloat(tx.payment) || 0;
    }
  });

  const remainingBags = totalDeposited - totalWithdrawn;

  return {
    totalDeposited,
    totalWithdrawn,
    remainingBags,
    totalPaid: parseFloat(totalPaid.toFixed(2)), // Ensure totalPaid is a proper number
  };
};

/**
 * Calculate total rent based on deposited bags and rent per bag
 * @param {number} totalDeposited - Total deposited bags
 * @param {number} rentPerBag - Rent per bag
 * @returns {number} - Total rent
 */
export const calculateTotalRent = (totalDeposited, rentPerBag) => {
  return totalDeposited * rentPerBag;
};

/**
 * Calculate pending amount
 * @param {number} totalRent - Total rent
 * @param {number} totalPaid - Total paid
 * @returns {number} - Pending amount
 */
export const calculatePendingAmount = (totalRent, totalPaid) => {
  return Math.max(0, totalRent - totalPaid);
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN');
};

/**
 * Get total storage capacity
 * @returns {number} - Total capacity in bags
 */
export const getStorageCapacity = () => {
  const capacity = localStorage.getItem('storageCapacity');
  return capacity ? parseInt(capacity, 10) : 1000;
};

/**
 * Set storage capacity
 * @param {number} capacity - Capacity in bags
 */
export const setStorageCapacity = (capacity) => {
  localStorage.setItem('storageCapacity', capacity.toString());
};

/**
 * Get default rent per bag
 * @returns {number} - Default rent per bag
 */
export const getDefaultRentPerBag = () => {
  const rent = localStorage.getItem('defaultRentPerBag');
  return rent ? parseFloat(rent) : 50;
};

/**
 * Set default rent per bag
 * @param {number} rent - Rent per bag
 */
export const setDefaultRentPerBag = (rent) => {
  localStorage.setItem('defaultRentPerBag', rent.toString());
};

/**
 * Get cold storage name
 * @returns {string}
 */
export const getStorageName = () => {
  const name = localStorage.getItem('storageName');
  return name ? name : 'Cold Storage Management System';
};

/**
 * Set cold storage name
 * @param {string} name
 */
export const setStorageName = (name) => {
  localStorage.setItem('storageName', name.toString());
};
