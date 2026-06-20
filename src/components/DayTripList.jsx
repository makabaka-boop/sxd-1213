import { useMemo, useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Calendar,
  Copy,
  DollarSign,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Save,
  X,
  CheckCheck,
} from 'lucide-react';
import TripCard from './TripCard';
import { sortTripsByOrder, MAX_TRANSPORT_TIME_PER_DAY } from '../utils/checks';

const DayTripList = ({
  date,
  trips,
  selectedIds,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  onDuplicateDay,
  onAddTrip,
  issues,
  dailyBudget,
  suggestionCountByTripId = {},
  onShowOptimization,
  confirmationProgress,
  riskSummary,
  dayMeta,
  onUpdateDayMeta,
  dailyBudgetLimit,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedTrips = useMemo(() => sortTripsByOrder(trips), [trips]);

  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewDraft, setReviewDraft] = useState('');
  const reviewTextareaRef = useRef(null);

  useEffect(() => {
    if (isEditingReview && reviewTextareaRef.current) {
      reviewTextareaRef.current.focus();
    }
  }, [isEditingReview]);

  const totalTransportTime = sortedTrips.reduce(
    (sum, trip) => sum + (trip.transportTime || 0),
    0
  );

  const dayIssues = issues.filter(issue => issue.date === date);

  const progress = confirmationProgress || {
    total: sortedTrips.length,
    confirmed: 0,
    pending: sortedTrips.length,
    progressPercent: 0,
  };

  const risk = riskSummary || {
    risks: [],
    count: 0,
    maxSeverity: null,
  };

  const budgetUsed = dailyBudget || 0;
  const budgetPercent = Math.min(Math.round((budgetUsed / dailyBudgetLimit) * 100), 100);
  const isBudgetOver = budgetUsed > dailyBudgetLimit;

  const transportPercent = Math.min(
    Math.round((totalTransportTime / MAX_TRANSPORT_TIME_PER_DAY) * 100),
    100
  );
  const isTransportOver = totalTransportTime > MAX_TRANSPORT_TIME_PER_DAY;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedTrips.findIndex(t => t.id === active.id);
      const newIndex = sortedTrips.findIndex(t => t.id === over.id);
      const newTrips = arrayMove(sortedTrips, oldIndex, newIndex);
      const updatedTrips = newTrips.map((trip, index) => ({
        ...trip,
        order: index,
      }));
      onReorder(updatedTrips);
    }
  };

  const handleStartEditReview = () => {
    setReviewDraft(dayMeta?.reviewNote || '');
    setIsEditingReview(true);
  };

  const handleSaveReview = async () => {
    await onUpdateDayMeta(date, { reviewNote: reviewDraft.trim() });
    setIsEditingReview(false);
  };

  const handleCancelEditReview = () => {
    setReviewDraft('');
    setIsEditingReview(false);
  };

  const existingReview = dayMeta?.reviewNote;

  return (
    <div className="day-trip-group" data-date={date}>
      <div className="day-header">
        <div className="day-title">
          <Calendar size={20} />
          <span className="date-text">{date}</span>
          <span className="trip-count">{sortedTrips.length} 项</span>
          {progress.total > 0 && (
            <span className={`progress-badge progress-${progress.progressPercent === 100 ? 'done' : progress.progressPercent > 50 ? 'mid' : 'low'}`}>
              <CheckCheck size={12} />
              {progress.progressPercent}%
            </span>
          )}
        </div>
        <div className="day-stats">
          <div className={`day-stat ${isBudgetOver ? 'stat-danger' : ''}`}>
            <DollarSign size={14} />
            <span>¥{budgetUsed}</span>
            <span className="stat-sub">/¥{dailyBudgetLimit}</span>
          </div>
          <div className={`day-stat ${isTransportOver ? 'stat-warning' : ''}`}>
            <Clock size={14} />
            <span>{totalTransportTime}h</span>
            <span className="stat-sub">/{MAX_TRANSPORT_TIME_PER_DAY}h</span>
          </div>
          <div className="day-stat stat-confirm">
            <CheckCircle2 size={14} />
            <span>{progress.confirmed}</span>
            <span className="stat-sub">/{progress.total} 已确认</span>
          </div>
        </div>
        <div className="day-actions">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onDuplicateDay(date)}
            title="复制这一天的所有行程"
          >
            <Copy size={14} />
            复制当天
          </button>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={() => onAddTrip(date)}
          >
            <Plus size={14} />
            添加
          </button>
        </div>
      </div>

      <div className="day-summary-panel">
        <div className="summary-section">
          <div className="summary-row">
            <div className="summary-label">
              <DollarSign size={13} />
              <span>预算使用</span>
            </div>
            <div className="summary-value">
              <span className={isBudgetOver ? 'text-danger' : ''}>¥{budgetUsed}</span>
              <span className="summary-max">/¥{dailyBudgetLimit}</span>
              {isBudgetOver && (
                <span className="over-tag over-tag-danger">超 ¥{budgetUsed - dailyBudgetLimit}</span>
              )}
            </div>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill progress-budget ${isBudgetOver ? 'fill-danger' : ''}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>

        <div className="summary-section">
          <div className="summary-row">
            <div className="summary-label">
              <Clock size={13} />
              <span>交通时长</span>
            </div>
            <div className="summary-value">
              <span className={isTransportOver ? 'text-warning' : ''}>{totalTransportTime}h</span>
              <span className="summary-max">/{MAX_TRANSPORT_TIME_PER_DAY}h</span>
              {isTransportOver && (
                <span className="over-tag over-tag-warning">超 {totalTransportTime - MAX_TRANSPORT_TIME_PER_DAY}h</span>
              )}
            </div>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill progress-transport ${isTransportOver ? 'fill-warning' : ''}`}
              style={{ width: `${transportPercent}%` }}
            />
          </div>
        </div>

        <div className="summary-section">
          <div className="summary-row">
            <div className="summary-label">
              <CheckCircle2 size={13} />
              <span>确认进度</span>
            </div>
            <div className="summary-value">
              <span className="text-success">{progress.confirmed} 已确认</span>
              <span className="summary-sep">·</span>
              <span className="text-pending">{progress.pending} 待处理</span>
            </div>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill progress-confirm"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>

        {risk.count > 0 && (
          <div className="summary-section summary-risks">
            <div className="summary-label">
              <AlertTriangle size={13} />
              <span>风险提示</span>
            </div>
            <div className="risk-chips">
              {risk.risks.map((r, idx) => (
                <span
                  key={idx}
                  className={`risk-chip risk-${r.severity}`}
                  title={r.detail}
                >
                  {r.severity === 'error' ? (
                    <AlertTriangle size={11} />
                  ) : (
                    <AlertCircle size={11} />
                  )}
                  {r.label}
                  <span className="risk-chip-detail">{r.detail}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="summary-section summary-review">
          <div className="summary-label">
            <FileText size={13} />
            <span>复盘备注</span>
          </div>

          {isEditingReview ? (
            <div className="review-editor">
              <textarea
                ref={reviewTextareaRef}
                className="review-textarea"
                value={reviewDraft}
                onChange={(e) => setReviewDraft(e.target.value)}
                placeholder="记录当天行程的复盘心得、注意事项或调整说明..."
                rows={2}
              />
              <div className="review-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveReview}
                >
                  <Save size={13} />
                  保存备注
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancelEditReview}
                >
                  <X size={13} />
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`review-display ${!existingReview ? 'review-empty' : ''}`}
              onClick={handleStartEditReview}
              title={existingReview ? '点击编辑复盘备注' : '点击添加复盘备注'}
            >
              {existingReview ? (
                <>
                  <FileText size={13} className="review-icon" />
                  <span className="review-text">{existingReview}</span>
                </>
              ) : (
                <>
                  <Plus size={13} className="review-icon review-empty-icon" />
                  <span className="review-text">添加复盘备注...</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {dayIssues.length > 0 && (
        <div className="day-issues-bar">
          {dayIssues.map((issue, idx) => (
            <div key={idx} className={`day-issue issue-${issue.severity}`}>
              {issue.message}
            </div>
          ))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTrips.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="trip-cards-list">
            {sortedTrips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                isSelected={selectedIds.includes(trip.id)}
                onSelect={onSelect}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                issues={issues}
                suggestionCount={suggestionCountByTripId[trip.id] || 0}
                onShowOptimization={onShowOptimization}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedTrips.length === 0 && (
        <div className="empty-day">
          <p>这一天还没有行程</p>
        </div>
      )}
    </div>
  );
};

export default DayTripList;
