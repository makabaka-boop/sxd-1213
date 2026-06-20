import { useMemo } from 'react';
import {
  Calendar,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { getSeverityLabel, getSuggestionTypeLabel } from '../utils/checks';
import { SUGGESTION_TYPE } from '../utils/checks';

const severityIcon = (severity) => {
  switch (severity) {
    case 'error':
      return <AlertTriangle size={16} />;
    case 'warning':
      return <AlertCircle size={16} />;
    default:
      return <Info size={16} />;
  }
};

const DaySuggestionList = ({
  date,
  suggestions,
  trips,
  onAdopt,
  onClearFocus,
  focusTripId,
  confirmationProgress,
  riskSummary,
  dayMeta,
  onViewDate,
}) => {
  const tripMap = useMemo(() => {
    const map = {};
    trips.forEach(t => { map[t.id] = t; });
    return map;
  }, [trips]);

  const isFocused = useMemo(
    () => !!focusTripId && suggestions.some(s => s.tripIds?.includes(focusTripId)),
    [suggestions, focusTripId]
  );

  const progress = confirmationProgress || {
    total: 0,
    confirmed: 0,
    pending: 0,
    progressPercent: 0,
  };

  const hasHighRiskRisk = suggestions.some(
    s => s.type === SUGGESTION_TYPE.BUDGET_OVERRUN
      || s.type === SUGGESTION_TYPE.TRANSPORT_OVERRUN
      || s.type === SUGGESTION_TYPE.CITY_TRANSFER_RISK
  );

  const meta = dayMeta;
  const hasReview = !!(meta && meta.reviewNote && meta.reviewNote.trim());

  const lowProgress = progress.total > 0 && progress.progressPercent < 50;
  const shouldPrioritize = hasHighRiskRisk && lowProgress;

  return (
    <div className={`day-suggestion-group ${isFocused ? 'focused' : ''}`}>
      <div
        className="day-suggestion-header"
        onClick={(e) => {
          if (e.target.closest('.goto-date-btn')) return;
          onClearFocus && onClearFocus();
        }}
      >
        <div className="day-suggestion-title">
          <Calendar size={18} />
          <span className="day-suggestion-date">{date}</span>
          <span className="day-suggestion-count">{suggestions.length} 条建议</span>
          {shouldPrioritize && (
            <span className="priority-tag priority-high">
              <AlertTriangle size={11} />
              建议优先处理
            </span>
          )}
        </div>

        <div className="day-suggestion-progress">
          <div className="day-suggestion-progress-item">
            <CheckCircle2 size={13} className="icon-success" />
            <span>{progress.confirmed}/{progress.total}</span>
          </div>
          <div className="day-suggestion-progress-track">
            <div
              className={`day-suggestion-progress-fill ${progress.progressPercent === 100 ? 'fill-success' : lowProgress ? 'fill-warning' : ''}`}
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <span className="day-suggestion-progress-percent">
            {progress.progressPercent}%
          </span>
          {hasReview && (
            <span
              className="day-suggestion-review-indicator"
              title={`复盘备注：${meta.reviewNote}`}
            >
              <FileText size={13} />
            </span>
          )}
          <button
            className="btn btn-outline btn-xs goto-date-btn"
            onClick={() => onViewDate && onViewDate(date)}
            title="跳转到该日期行程"
          >
            查看详情
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="suggestion-cards-list">
        {suggestions.map(suggestion => {
          const hasAction = !!suggestion.action;
          const relatedTrips = (suggestion.tripIds || [])
            .map(id => tripMap[id])
            .filter(Boolean);
          const isHighlighted = focusTripId && suggestion.tripIds?.includes(focusTripId);
          const isHighPrioritySuggestion =
            suggestion.type === SUGGESTION_TYPE.BUDGET_OVERRUN
            || suggestion.type === SUGGESTION_TYPE.TRANSPORT_OVERRUN
            || suggestion.type === SUGGESTION_TYPE.CITY_TRANSFER_RISK;

          const handleCardClick = (e) => {
            if (e.target.closest('button')) return;
            if (isHighlighted) {
              onClearFocus && onClearFocus();
            }
          };

          return (
            <div
              key={suggestion.id}
              className={`suggestion-card suggestion-${suggestion.severity} ${
                isHighlighted ? 'highlight' : ''
              }`}
              onClick={handleCardClick}
            >
              {isHighPrioritySuggestion && shouldPrioritize && (
                <div className="suggestion-priority-banner">
                  <AlertTriangle size={13} />
                  <span>
                    该日期确认进度仅 {progress.progressPercent}%，
                    {progress.pending} 项待处理，建议先完成确认再优化行程
                  </span>
                </div>
              )}

              <div className="suggestion-card-top">
                <div className={`suggestion-icon suggestion-icon-${suggestion.severity}`}>
                  {severityIcon(suggestion.severity)}
                </div>
                <div className="suggestion-card-main">
                  <div className="suggestion-card-title-row">
                    <span className="suggestion-title">{suggestion.title}</span>
                    <span className="suggestion-type-tag">
                      {getSuggestionTypeLabel(suggestion.type)}
                    </span>
                  </div>
                  <p className="suggestion-message">{suggestion.message}</p>
                  <p className="suggestion-reason">{suggestion.reason}</p>
                  {relatedTrips.length > 0 && (
                    <div className="suggestion-trip-chips">
                      {relatedTrips.map(trip => (
                        <span key={trip.id} className="suggestion-trip-chip">
                          <MapPin size={11} />
                          {trip.locationName || '未命名'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`suggestion-severity-tag suggestion-severity-${suggestion.severity}`}>
                  {getSeverityLabel(suggestion.severity)}
                </span>
              </div>

              {hasAction && (
                <div className="suggestion-card-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onAdopt(suggestion)}
                  >
                    <Check size={14} />
                    {suggestion.action.label}
                  </button>
                  <span className="suggestion-action-hint">
                    采纳后将写入对应行程的
                    {suggestion.action.type === 'set_status' ? '确认状态' : '备注'}
                  </span>
                </div>
              )}
              {!hasAction && (
                <div className="suggestion-card-actions">
                  <span className="suggestion-action-hint">参考建议，请在行程列表中手动调整</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DaySuggestionList;
