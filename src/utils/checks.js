import { TRIP_STATUS } from '../db/indexedDB';

export const DAILY_BUDGET_LIMIT = 500;
export const MAX_TRANSPORT_TIME_PER_DAY = 4;
export const MIN_CITY_TRANSFER_GAP = 2;

export const groupTripsByDate = (trips) => {
  const groups = {};
  trips.forEach(trip => {
    if (!groups[trip.date]) {
      groups[trip.date] = [];
    }
    groups[trip.date].push(trip);
  });
  return groups;
};

export const sortTripsByOrder = (trips) => {
  return [...trips].sort((a, b) => a.order - b.order);
};

export const checkDailyTransportTime = (trips) => {
  const issues = [];
  const groups = groupTripsByDate(trips);
  
  Object.entries(groups).forEach(([date, dayTrips]) => {
    const totalTransportTime = dayTrips.reduce((sum, trip) => sum + (trip.transportTime || 0), 0);
    if (totalTransportTime > MAX_TRANSPORT_TIME_PER_DAY) {
      issues.push({
        type: 'transport_time_exceeded',
        severity: 'warning',
        date,
        message: `${date} 当日交通总时长 ${totalTransportTime} 小时，超过建议上限 ${MAX_TRANSPORT_TIME_PER_DAY} 小时`,
        tripIds: dayTrips.map(t => t.id),
      });
    }
  });
  
  return issues;
};

export const checkDailyBudget = (trips, dailyLimit = DAILY_BUDGET_LIMIT) => {
  const issues = [];
  const groups = groupTripsByDate(trips);
  
  Object.entries(groups).forEach(([date, dayTrips]) => {
    const totalCost = dayTrips.reduce((sum, trip) => sum + (trip.estimatedCost || 0), 0);
    if (totalCost > dailyLimit) {
      issues.push({
        type: 'budget_exceeded',
        severity: 'error',
        date,
        message: `${date} 当日预算 ${totalCost} 元，超过每日上限 ${dailyLimit} 元`,
        tripIds: dayTrips.map(t => t.id),
      });
    }
  });
  
  return issues;
};

export const checkDuplicateLocations = (trips) => {
  const issues = [];
  const locationMap = {};
  
  trips.forEach(trip => {
    const key = `${trip.date}-${trip.locationName}`;
    if (trip.locationName) {
      if (!locationMap[key]) {
        locationMap[key] = [];
      }
      locationMap[key].push(trip.id);
    }
  });
  
  Object.entries(locationMap).forEach(([key, ids]) => {
    if (ids.length > 1) {
      const [date, locationName] = key.split('-');
      issues.push({
        type: 'duplicate_location',
        severity: 'warning',
        date,
        message: `${date} 地点「${locationName}」重复出现 ${ids.length} 次`,
        tripIds: ids,
      });
    }
  });
  
  return issues;
};

export const checkMissingAlternativeNote = (trips) => {
  const issues = [];
  
  trips.forEach(trip => {
    if (trip.status === TRIP_STATUS.CANCEL_CANDIDATE && !trip.alternativeNote?.trim()) {
      issues.push({
        type: 'missing_alternative',
        severity: 'info',
        date: trip.date,
        message: `「${trip.locationName}」为取消候选，但缺少备选说明`,
        tripIds: [trip.id],
      });
    }
  });
  
  return issues;
};

export const checkCityTransferGap = (trips) => {
  const issues = [];
  const sortedTrips = sortTripsByOrder(trips);
  const groups = groupTripsByDate(sortedTrips);
  
  Object.entries(groups).forEach(([date, dayTrips]) => {
    const sorted = sortTripsByOrder(dayTrips);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      if (current.city && next.city && current.city !== next.city) {
        const gap = next.transportTime || 0;
        if (gap < MIN_CITY_TRANSFER_GAP) {
          issues.push({
            type: 'city_transfer_tight',
            severity: 'error',
            date,
            message: `${date} 「${current.locationName}」到「${next.locationName}」跨城市衔接，预留 ${gap} 小时偏紧（建议至少 ${MIN_CITY_TRANSFER_GAP} 小时）`,
            tripIds: [current.id, next.id],
          });
        }
      }
    }
  });
  
  return issues;
};

export const checkPendingConfirmation = (trips) => {
  const issues = [];
  
  trips.forEach(trip => {
    if (trip.status === TRIP_STATUS.PENDING) {
      issues.push({
        type: 'pending_confirmation',
        severity: 'info',
        date: trip.date,
        message: `「${trip.locationName}」待确认`,
        tripIds: [trip.id],
      });
    }
  });
  
  return issues;
};

export const checkHighBudgetStatus = (trips) => {
  const issues = [];
  
  trips.forEach(trip => {
    if (trip.status === TRIP_STATUS.HIGH_BUDGET) {
      issues.push({
        type: 'high_budget',
        severity: 'warning',
        date: trip.date,
        message: `「${trip.locationName}」预算偏高`,
        tripIds: [trip.id],
      });
    }
  });
  
  return issues;
};

export const runAllChecks = (trips, dailyLimit = DAILY_BUDGET_LIMIT) => {
  const allIssues = [
    ...checkDailyTransportTime(trips),
    ...checkDailyBudget(trips, dailyLimit),
    ...checkDuplicateLocations(trips),
    ...checkMissingAlternativeNote(trips),
    ...checkCityTransferGap(trips),
    ...checkPendingConfirmation(trips),
    ...checkHighBudgetStatus(trips),
  ];
  
  return allIssues.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

export const calculateDailyBudget = (trips) => {
  const groups = groupTripsByDate(trips);
  const budgetByDate = {};
  
  Object.entries(groups).forEach(([date, dayTrips]) => {
    budgetByDate[date] = dayTrips.reduce((sum, trip) => sum + (trip.estimatedCost || 0), 0);
  });
  
  return budgetByDate;
};

export const getStatusLabel = (status) => {
  const labels = {
    [TRIP_STATUS.PENDING]: '待确认',
    [TRIP_STATUS.CONFIRMED]: '已确认',
    [TRIP_STATUS.HIGH_BUDGET]: '预算偏高',
    [TRIP_STATUS.CANCEL_CANDIDATE]: '取消候选',
  };
  return labels[status] || status;
};

export const getPriorityLabel = (priority) => {
  const labels = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return labels[priority] || priority;
};

export const getSeverityLabel = (severity) => {
  const labels = {
    error: '严重',
    warning: '警告',
    info: '提示',
  };
  return labels[severity] || severity;
};
