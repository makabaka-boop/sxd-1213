import { TRIP_STATUS, PRIORITY } from '../db/indexedDB';

export const DAILY_BUDGET_LIMIT = 500;
export const MAX_TRANSPORT_TIME_PER_DAY = 4;
export const MIN_CITY_TRANSFER_GAP = 2;

export const SUGGESTION_TYPE = {
  BUDGET_OVERRUN: 'budget_overrun',
  TRANSPORT_OVERRUN: 'transport_overrun',
  LOW_PRIORITY_ADJUSTABLE: 'low_priority_adjustable',
  ALTERNATIVE_NOTE_MISSING: 'alternative_note_missing',
  CITY_TRANSFER_RISK: 'city_transfer_risk',
  PENDING_CONFIRMATION: 'pending_confirmation',
};

export const SUGGESTION_ACTION = {
  SET_STATUS: 'set_status',
  FILL_REMARK: 'fill_remark',
};

export const getSuggestionTypeLabel = (type) => {
  const labels = {
    [SUGGESTION_TYPE.BUDGET_OVERRUN]: '预算超限',
    [SUGGESTION_TYPE.TRANSPORT_OVERRUN]: '交通超限',
    [SUGGESTION_TYPE.LOW_PRIORITY_ADJUSTABLE]: '可调整行程',
    [SUGGESTION_TYPE.ALTERNATIVE_NOTE_MISSING]: '缺少替代方案',
    [SUGGESTION_TYPE.CITY_TRANSFER_RISK]: '跨城衔接风险',
    [SUGGESTION_TYPE.PENDING_CONFIRMATION]: '待确认',
  };
  return labels[type] || type;
};

const appendRemark = (existing, text) => {
  const base = (existing || '').trim();
  return base ? `${base} | ${text}` : text;
};

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
  const locationMap = new Map();
  
  trips.forEach(trip => {
    if (trip.locationName) {
      const dateKey = trip.date || '';
      const mapKey = `${dateKey}||${trip.locationName}`;
      if (!locationMap.has(mapKey)) {
        locationMap.set(mapKey, { date: dateKey, locationName: trip.locationName, ids: [] });
      }
      locationMap.get(mapKey).ids.push(trip.id);
    }
  });
  
  locationMap.forEach(({ date, locationName, ids }) => {
    if (ids.length > 1) {
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
    const needAlternativeNote = 
      trip.status === TRIP_STATUS.CANCEL_CANDIDATE ||
      trip.status === TRIP_STATUS.HIGH_BUDGET ||
      trip.status === TRIP_STATUS.PENDING;
    
    if (needAlternativeNote && !trip.alternativeNote?.trim()) {
      issues.push({
        type: 'missing_alternative',
        severity: 'info',
        date: trip.date,
        message: `「${trip.locationName}」缺少备选说明（${getStatusLabel(trip.status)}状态建议填写备选方案）`,
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

export const analyzeDayBudget = (dayTrips, dailyLimit = DAILY_BUDGET_LIMIT) => {
  const total = dayTrips.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
  const overrun = total - dailyLimit;
  const contributors = [...dayTrips]
    .sort((a, b) => (b.estimatedCost || 0) - (a.estimatedCost || 0))
    .slice(0, 3)
    .map(t => ({
      id: t.id,
      locationName: t.locationName,
      estimatedCost: t.estimatedCost || 0,
    }));
  return {
    total,
    limit: dailyLimit,
    overrun,
    isOver: overrun > 0,
    contributors,
  };
};

export const analyzeDayTransport = (dayTrips) => {
  const total = dayTrips.reduce((sum, t) => sum + (t.transportTime || 0), 0);
  const overrun = total - MAX_TRANSPORT_TIME_PER_DAY;
  const sortedByTransport = [...dayTrips].sort(
    (a, b) => (b.transportTime || 0) - (a.transportTime || 0)
  );
  return {
    total,
    limit: MAX_TRANSPORT_TIME_PER_DAY,
    overrun,
    isOver: overrun > 0,
    topTrip: sortedByTransport[0],
  };
};

export const findCityTransferRisks = (dayTrips) => {
  const sorted = sortTripsByOrder(dayTrips);
  const risks = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.city && next.city && current.city !== next.city) {
      const gap = next.transportTime || 0;
      if (gap < MIN_CITY_TRANSFER_GAP) {
        risks.push({ current, next, gap });
      }
    }
  }
  return risks;
};

export const findLowPriorityCandidates = (dayTrips) => {
  return dayTrips.filter(
    t => t.priority === PRIORITY.LOW && t.status !== TRIP_STATUS.CANCEL_CANDIDATE
  );
};

export const findMissingAlternativeNotes = (dayTrips) => {
  return dayTrips.filter(trip => {
    const needAlternativeNote =
      trip.status === TRIP_STATUS.CANCEL_CANDIDATE ||
      trip.status === TRIP_STATUS.HIGH_BUDGET ||
      trip.status === TRIP_STATUS.PENDING;
    return needAlternativeNote && !trip.alternativeNote?.trim();
  });
};

export const generateOptimizationSuggestions = (trips, dailyLimit = DAILY_BUDGET_LIMIT) => {
  if (!trips || trips.length === 0) return [];
  const groups = groupTripsByDate(trips);
  const suggestions = [];

  Object.entries(groups).forEach(([date, dayTrips]) => {
    const budget = analyzeDayBudget(dayTrips, dailyLimit);
    const transport = analyzeDayTransport(dayTrips);
    const hasProblem = budget.isOver || transport.isOver;

    if (budget.isOver) {
      const reason = budget.contributors.length > 0
        ? `主要开销：${budget.contributors.map(c => `「${c.locationName}」¥${c.estimatedCost}`).join('、')}`
        : '当日累计开销过高';
      suggestions.push({
        id: `budget_overrun_${date}`,
        date,
        type: SUGGESTION_TYPE.BUDGET_OVERRUN,
        severity: 'error',
        title: '当日预算超限',
        message: `${date} 当日预算 ¥${budget.total} 超过上限 ¥${budget.limit}，超支 ¥${budget.overrun}`,
        reason,
        tripIds: dayTrips.map(t => t.id),
        action: null,
      });
    }

    if (transport.isOver) {
      const target = transport.topTrip;
      suggestions.push({
        id: `transport_overrun_${date}`,
        date,
        type: SUGGESTION_TYPE.TRANSPORT_OVERRUN,
        severity: 'error',
        title: '当日交通时长超限',
        message: `${date} 当日交通总时长 ${transport.total}h 超过建议上限 ${transport.limit}h，超出 ${transport.overrun}h`,
        reason: target
          ? `交通耗时最高：「${target.locationName}」${target.transportTime}h，建议精简跨城移动或合并路线`
          : '建议精简当日行程，减少跨城移动',
        tripIds: dayTrips.map(t => t.id),
        action: target
          ? {
              type: SUGGESTION_ACTION.FILL_REMARK,
              label: '记录调整建议到备注',
              targetTripId: target.id,
              patch: {
                remark: appendRemark(
                  target.remark,
                  '【优化】当日交通超限，建议精简跨城移动或合并路线'
                ),
              },
            }
          : null,
      });
    }

    if (hasProblem) {
      const candidates = findLowPriorityCandidates(dayTrips);
      candidates.forEach(trip => {
        suggestions.push({
          id: `low_priority_${trip.id}_${date}`,
          date,
          type: SUGGESTION_TYPE.LOW_PRIORITY_ADJUSTABLE,
          severity: 'warning',
          title: '可调整/取消的低优先级行程',
          message: `「${trip.locationName}」为低优先级，当日${budget.isOver ? '预算超限' : '交通超限'}，可考虑取消或调整`,
          reason: `当前状态：${getStatusLabel(trip.status)} · 预计 ¥${trip.estimatedCost || 0} · 交通 ${trip.transportTime || 0}h`,
          tripIds: [trip.id],
          action: {
            type: SUGGESTION_ACTION.SET_STATUS,
            label: '标记为取消候选',
            targetTripId: trip.id,
            patch: { status: TRIP_STATUS.CANCEL_CANDIDATE },
          },
        });
      });
    }

    const risks = findCityTransferRisks(dayTrips);
    risks.forEach(risk => {
      const { current, next, gap } = risk;
      suggestions.push({
        id: `city_transfer_${date}_${current.id}_${next.id}`,
        date,
        type: SUGGESTION_TYPE.CITY_TRANSFER_RISK,
        severity: 'error',
        title: '跨城市衔接风险',
        message: `「${current.locationName}」(${current.city}) → 「${next.locationName}」(${next.city}) 跨城衔接仅预留 ${gap}h（建议至少 ${MIN_CITY_TRANSFER_GAP}h）`,
        reason: '跨城移动时间不足，易导致后续行程延误，建议增加缓冲时间或调整顺序',
        tripIds: [current.id, next.id],
        action: {
          type: SUGGESTION_ACTION.FILL_REMARK,
          label: '记录衔接风险到备注',
          targetTripId: current.id,
          patch: {
            remark: appendRemark(
              current.remark,
              `【优化】到「${next.locationName}」跨城衔接仅 ${gap}h，建议增加缓冲时间`
            ),
          },
        },
      });
    });

    findMissingAlternativeNotes(dayTrips).forEach(trip => {
      suggestions.push({
        id: `alt_note_${trip.id}_${date}`,
        date,
        type: SUGGESTION_TYPE.ALTERNATIVE_NOTE_MISSING,
        severity: 'info',
        title: '缺少替代方案',
        message: `「${trip.locationName}」为「${getStatusLabel(trip.status)}」状态，尚未填写备选/替代方案`,
        reason: '该状态建议补充替代方案，以便行程变动时有备选可切换',
        tripIds: [trip.id],
        action: {
          type: SUGGESTION_ACTION.FILL_REMARK,
          label: '添加填写提醒到备注',
          targetTripId: trip.id,
          patch: {
            remark: appendRemark(
              trip.remark,
              '【提醒】请尽快为该行程填写替代方案（如改去其他景点、调整时段等）'
            ),
          },
        },
      });
    });

    dayTrips
      .filter(t => t.status === TRIP_STATUS.PENDING)
      .forEach(trip => {
        suggestions.push({
          id: `pending_${trip.id}_${date}`,
          date,
          type: SUGGESTION_TYPE.PENDING_CONFIRMATION,
          severity: 'info',
          title: '待确认行程',
          message: `「${trip.locationName}」仍为待确认状态`,
          reason: '出发前需确认该行程是否成行，确认后可降低行程不确定性',
          tripIds: [trip.id],
          action: {
            type: SUGGESTION_ACTION.SET_STATUS,
            label: '标记为已确认',
            targetTripId: trip.id,
            patch: { status: TRIP_STATUS.CONFIRMED },
          },
        });
      });
  });

  const severityOrder = { error: 0, warning: 1, info: 2 };
  return suggestions.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

export const summarizeSuggestions = (suggestions) => {
  const counts = { error: 0, warning: 0, info: 0, total: suggestions.length };
  suggestions.forEach(s => {
    if (counts[s.severity] !== undefined) counts[s.severity]++;
  });
  return counts;
};

export const calculateDailyConfirmationProgress = (trips) => {
  const groups = groupTripsByDate(trips);
  const progressByDate = {};

  Object.entries(groups).forEach(([date, dayTrips]) => {
    const total = dayTrips.length;
    let confirmed = 0;
    let pending = 0;
    let highBudget = 0;
    let cancelCandidate = 0;

    dayTrips.forEach(trip => {
      switch (trip.status) {
        case TRIP_STATUS.CONFIRMED:
          confirmed++;
          break;
        case TRIP_STATUS.PENDING:
          pending++;
          break;
        case TRIP_STATUS.HIGH_BUDGET:
          highBudget++;
          pending++;
          break;
        case TRIP_STATUS.CANCEL_CANDIDATE:
          cancelCandidate++;
          pending++;
          break;
        default:
          pending++;
      }
    });

    progressByDate[date] = {
      total,
      confirmed,
      pending,
      highBudget,
      cancelCandidate,
      progressPercent: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  });

  return progressByDate;
};

export const calculateDailyRiskSummary = (trips, dailyLimit = DAILY_BUDGET_LIMIT) => {
  const groups = groupTripsByDate(trips);
  const riskByDate = {};

  Object.entries(groups).forEach(([date, dayTrips]) => {
    const budget = analyzeDayBudget(dayTrips, dailyLimit);
    const transport = analyzeDayTransport(dayTrips);
    const transferRisks = findCityTransferRisks(dayTrips);

    const risks = [];
    if (budget.isOver) {
      risks.push({
        type: 'budget_overrun',
        severity: 'error',
        label: '预算超限',
        detail: `超支 ¥${budget.overrun}`,
      });
    }
    if (transport.isOver) {
      risks.push({
        type: 'transport_overrun',
        severity: 'warning',
        label: '交通超限',
        detail: `超出 ${transport.overrun}h`,
      });
    }
    if (transferRisks.length > 0) {
      risks.push({
        type: 'city_transfer',
        severity: 'error',
        label: '跨城风险',
        detail: `${transferRisks.length} 处衔接偏紧`,
      });
    }

    let maxSeverity = null;
    if (risks.length > 0) {
      const severityOrder = { info: 0, warning: 1, error: 2 };
      maxSeverity = risks.reduce((max, r) =>
        severityOrder[r.severity] > severityOrder[max] ? r.severity : max,
        'info'
      );
    }

    riskByDate[date] = {
      risks,
      count: risks.length,
      maxSeverity,
      hasBudgetOverrun: budget.isOver,
      hasTransportOverrun: transport.isOver,
      hasTransferRisk: transferRisks.length > 0,
    };
  });

  return riskByDate;
};

export const getDaySummary = (date, trips, dailyLimit = DAILY_BUDGET_LIMIT) => {
  const dayTrips = trips.filter(t => t.date === date);
  const totalBudget = dayTrips.reduce((sum, t) => sum + (t.estimatedCost || 0), 0);
  const totalTransport = dayTrips.reduce((sum, t) => sum + (t.transportTime || 0), 0);

  let confirmed = 0;
  let pending = 0;
  dayTrips.forEach(trip => {
    if (trip.status === TRIP_STATUS.CONFIRMED) confirmed++;
    else pending++;
  });

  const budget = analyzeDayBudget(dayTrips, dailyLimit);
  const transport = analyzeDayTransport(dayTrips);
  const transferRisks = findCityTransferRisks(dayTrips);

  return {
    date,
    totalTrips: dayTrips.length,
    totalBudget,
    totalTransport,
    budgetOverBudget: budget.isOver,
    budgetOverrun: budget.overrun,
    transportOverLimit: transport.isOver,
    transportOverrun: transport.overrun,
    transferRiskCount: transferRisks.length,
    confirmed,
    pending,
    progressPercent: dayTrips.length > 0 ? Math.round((confirmed / dayTrips.length) * 100) : 0,
  };
};
