import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ==================== FARMERS ====================

/**
 * Add a new farmer
 */
export const addFarmer = async (farmerData) => {
  try {
    const docRef = await addDoc(collection(db, 'farmers'), {
      ...farmerData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding farmer:', error);
    throw error;
  }
};

/**
 * Get all farmers
 */
export const getAllFarmers = async () => {
  try {
    const q = query(
      collection(db, 'farmers'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const farmers = [];
    querySnapshot.forEach((doc) => {
      farmers.push({ id: doc.id, ...doc.data() });
    });
    return farmers;
  } catch (error) {
    console.error('Error getting farmers:', error);
    throw error;
  }
};

/**
 * Get farmer by ID
 */
export const getFarmerById = async (farmerId) => {
  try {
    const docRef = doc(db, 'farmers', farmerId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting farmer:', error);
    throw error;
  }
};

/**
 * Update farmer
 */
export const updateFarmer = async (farmerId, updatedData) => {
  try {
    const docRef = doc(db, 'farmers', farmerId);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error('Error updating farmer:', error);
    throw error;
  }
};

/**
 * Delete farmer
 */
export const deleteFarmer = async (farmerId) => {
  try {
    await deleteDoc(doc(db, 'farmers', farmerId));
  } catch (error) {
    console.error('Error deleting farmer:', error);
    throw error;
  }
};

// ==================== SEASONS ====================

/**
 * Add a new season for a farmer
 */
export const addSeason = async (farmerId, seasonData) => {
  try {
    const docRef = await addDoc(
      collection(db, 'farmers', farmerId, 'seasons'),
      {
        ...seasonData,
        createdAt: Timestamp.now(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error('Error adding season:', error);
    throw error;
  }
};

/**
 * Get all seasons for a farmer
 */
export const getSeasons = async (farmerId) => {
  try {
    const q = query(
      collection(db, 'farmers', farmerId, 'seasons'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const seasons = [];
    querySnapshot.forEach((doc) => {
      seasons.push({ id: doc.id, ...doc.data() });
    });
    return seasons;
  } catch (error) {
    console.error('Error getting seasons:', error);
    throw error;
  }
};

/**
 * Get season by ID
 */
export const getSeasonById = async (farmerId, seasonId) => {
  try {
    const docRef = doc(db, 'farmers', farmerId, 'seasons', seasonId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting season:', error);
    throw error;
  }
};

/**
 * Update season
 */
export const updateSeason = async (farmerId, seasonId, updatedData) => {
  try {
    const docRef = doc(db, 'farmers', farmerId, 'seasons', seasonId);
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error('Error updating season:', error);
    throw error;
  }
};

/**
 * Delete season
 */
export const deleteSeason = async (farmerId, seasonId) => {
  try {
    await deleteDoc(doc(db, 'farmers', farmerId, 'seasons', seasonId));
  } catch (error) {
    console.error('Error deleting season:', error);
    throw error;
  }
};

// ==================== TRANSACTIONS ====================

/**
 * Add a transaction
 */
export const addTransaction = async (farmerId, seasonId, transactionData) => {
  try {
    const docRef = await addDoc(
      collection(db, 'farmers', farmerId, 'seasons', seasonId, 'transactions'),
      {
        ...transactionData,
        date: transactionData.date || Timestamp.now(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

/**
 * Get all transactions for a season
 */
export const getTransactions = async (farmerId, seasonId) => {
  try {
    const q = query(
      collection(
        db,
        'farmers',
        farmerId,
        'seasons',
        seasonId,
        'transactions'
      ),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

/**
 * Update transaction
 */
export const updateTransaction = async (
  farmerId,
  seasonId,
  transactionId,
  updatedData
) => {
  try {
    const docRef = doc(
      db,
      'farmers',
      farmerId,
      'seasons',
      seasonId,
      'transactions',
      transactionId
    );
    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (
  farmerId,
  seasonId,
  transactionId
) => {
  try {
    await deleteDoc(
      doc(
        db,
        'farmers',
        farmerId,
        'seasons',
        seasonId,
        'transactions',
        transactionId
      )
    );
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

/**
 * Get all transactions across all seasons for a farmer
 */
export const getAllFarmerTransactions = async (farmerId) => {
  try {
    const seasons = await getSeasons(farmerId);
    const allTransactions = [];

    for (const season of seasons) {
      const transactions = await getTransactions(farmerId, season.id);
      allTransactions.push({
        season: season.id,
        seasonName: season.seasonName,
        rentPerBag: season.rentPerBag,
        transactions,
      });
    }

    return allTransactions;
  } catch (error) {
    console.error('Error getting all farmer transactions:', error);
    throw error;
  }
};
