import { openDB } from 'idb';

const DB_NAME = 'travel-budget-db';
const DB_VERSION = 1;
const STORE_NAME = 'trips';

let dbPromise = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('date', 'date');
        store.createIndex('city', 'city');
        store.createIndex('status', 'status');
        store.createIndex('priority', 'priority');
      }
    },
  });
  
  return dbPromise;
};

export const getAllTrips = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const getTripById = async (id) => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const addTrip = async (trip) => {
  const db = await initDB();
  return db.add(STORE_NAME, trip);
};

export const updateTrip = async (trip) => {
  const db = await initDB();
  return db.put(STORE_NAME, trip);
};

export const deleteTrip = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

export const bulkUpdateTrips = async (trips) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.store;
  
  const promises = trips.map(trip => store.put(trip));
  await Promise.all(promises);
  await tx.done;
  return trips;
};

export const bulkDeleteTrips = async (ids) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.store;
  
  const promises = ids.map(id => store.delete(id));
  await Promise.all(promises);
  await tx.done;
  return ids;
};

export const exportTrips = async () => {
  const trips = await getAllTrips();
  return JSON.stringify(trips, null, 2);
};

export const importTrips = async (jsonData) => {
  const trips = JSON.parse(jsonData);
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.store;
  
  const promises = trips.map(trip => {
    const { id, ...rest } = trip;
    return store.add(rest);
  });
  
  await Promise.all(promises);
  await tx.done;
  return trips.length;
};

export const TRIP_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  HIGH_BUDGET: 'high_budget',
  CANCEL_CANDIDATE: 'cancel_candidate',
};

export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const createEmptyTrip = () => ({
  date: '',
  city: '',
  locationName: '',
  estimatedCost: 0,
  transportTime: 0,
  priority: PRIORITY.MEDIUM,
  alternativeNote: '',
  status: TRIP_STATUS.PENDING,
  remark: '',
  order: 0,
});
