import { openDB } from 'idb';

const DB_NAME = 'travel-budget-db';
const DB_VERSION = 2;
const STORE_NAME = 'trips';
const DAY_META_STORE = 'day_meta';

let dbPromise = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
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
      if (!db.objectStoreNames.contains(DAY_META_STORE)) {
        const dayMetaStore = db.createObjectStore(DAY_META_STORE, {
          keyPath: 'date',
        });
        dayMetaStore.createIndex('date', 'date', { unique: true });
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

export const patchTrip = async (id, patch) => {
  const db = await initDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await db.put(STORE_NAME, updated);
  return updated;
};

export const bulkPatchTrips = async (patches) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.store;

  const updatedTrips = await Promise.all(
    patches.map(async ({ id, patch }) => {
      const existing = await store.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...patch };
      await store.put(updated);
      return updated;
    })
  );

  await tx.done;
  return updatedTrips.filter(Boolean);
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

const buildTripSignature = (trip) => {
  const { id, ...rest } = trip;
  return JSON.stringify(
    Object.keys(rest)
      .sort()
      .reduce((result, key) => {
        result[key] = rest[key];
        return result;
      }, {})
  );
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

export const getAllDayMeta = async () => {
  const db = await initDB();
  const entries = await db.getAll(DAY_META_STORE);
  const map = {};
  entries.forEach(entry => {
    map[entry.date] = entry;
  });
  return map;
};

export const getDayMeta = async (date) => {
  const db = await initDB();
  return db.get(DAY_META_STORE, date);
};

export const setDayMeta = async (date, meta) => {
  const db = await initDB();
  const existing = await db.get(DAY_META_STORE, date);
  const updated = {
    ...(existing || {}),
    ...meta,
    date,
    updatedAt: Date.now(),
  };
  await db.put(DAY_META_STORE, updated);
  return updated;
};

export const upsertDayMeta = async (date, patch) => {
  const db = await initDB();
  const existing = await db.get(DAY_META_STORE, date);
  const updated = {
    ...(existing || { date }),
    ...patch,
    date,
    updatedAt: Date.now(),
  };
  await db.put(DAY_META_STORE, updated);
  return updated;
};

export const bulkSetDayMeta = async (metaList) => {
  const db = await initDB();
  const tx = db.transaction(DAY_META_STORE, 'readwrite');
  const store = tx.store;
  const promises = metaList.map(meta => store.put({
    ...meta,
    updatedAt: Date.now(),
  }));
  await Promise.all(promises);
  await tx.done;
  return metaList;
};

export const deleteDayMeta = async (date) => {
  const db = await initDB();
  return db.delete(DAY_META_STORE, date);
};

export const exportAllData = async () => {
  const trips = await getAllTrips();
  const dayMeta = await getAllDayMeta();
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    trips,
    dayMeta: Object.values(dayMeta),
  };
  return JSON.stringify(payload, null, 2);
};

export const importAllData = async (jsonData, clearExisting = true) => {
  let parsed;
  try {
    parsed = JSON.parse(jsonData);
  } catch (e) {
    throw new Error('无效的 JSON 数据');
  }

  let trips = [];
  let dayMetaList = [];

  if (Array.isArray(parsed)) {
    trips = parsed;
  } else if (parsed && Array.isArray(parsed.trips)) {
    trips = parsed.trips;
    if (Array.isArray(parsed.dayMeta)) {
      dayMetaList = parsed.dayMeta;
    }
  } else {
    throw new Error('文件格式不正确');
  }

  if (!Array.isArray(trips)) {
    throw new Error('行程数据格式不正确');
  }

  const db = await initDB();
  const tx = db.transaction([STORE_NAME, DAY_META_STORE], 'readwrite');
  const tripStore = tx.objectStore(STORE_NAME);
  const dayMetaStore = tx.objectStore(DAY_META_STORE);

  if (clearExisting) {
    await tripStore.clear();
    await dayMetaStore.clear();
  }

  const existingSignatures = clearExisting
    ? new Set()
    : new Set((await tripStore.getAll()).map(buildTripSignature));

  const uniqueTrips = trips.filter((trip) => {
    const signature = buildTripSignature(trip);
    if (existingSignatures.has(signature)) {
      return false;
    }
    existingSignatures.add(signature);
    return true;
  });

  const tripPromises = uniqueTrips.map(trip => {
    const { id, ...rest } = trip;
    return tripStore.add(rest);
  });
  await Promise.all(tripPromises);

  const dayMetaPromises = dayMetaList.map(meta => dayMetaStore.put({
    ...meta,
    updatedAt: Date.now(),
  }));
  await Promise.all(dayMetaPromises);

  await tx.done;
  return { trips: uniqueTrips.length, dayMeta: dayMetaList.length };
};

export const exportTrips = async () => {
  return exportAllData();
};

export const importTrips = async (jsonData, clearExisting = true) => {
  const result = await importAllData(jsonData, clearExisting);
  return result.trips;
};

export const createEmptyDayMeta = (date) => ({
  date,
  reviewNote: '',
  updatedAt: Date.now(),
});
