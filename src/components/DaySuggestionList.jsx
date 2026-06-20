import { useMemo } from 'react';
import { Calendar, Check, AlertTriangle, AlertCircle, Info, MapPin } from 'lucide-react';
import { getSeverityLabel, getSuggestionTypeLabel } from '../utils/checks';

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

const DaySuggestionList = ({ date, suggestions, trips, onAdopt, onClearFocus, focusTripId }) => {
  const tripMap = useMemo(() => {
    const map = {};
    trips.forEach(t => { map[t.id] = t; });
    return map;
  }, [trips]);

  const isFocused = useMemo(
    () => !!focusTripId && suggestions.some(s => s.tripIds?.includes(focusTripId)),
    [suggestions, focusTripId]
  );

  return (
    <div className={`day-suggestion-group ${isFocused ? 'focused' : ''}`}>
      <div className="day-suggestion-header" onClick={onClearFocus}>
        <div className="day-suggestion-title">
          <Calendar size={18} />
          <span className="day-suggestion-date">{date}</span>
          <span className="day-suggestion-count">{suggestions.length} 条建议</span>
        </div>
      </div>

      <div className="suggestion-cards-list">
        {suggestions.map(suggestion => {
          const hasAction = !!suggestion.action;
          const relatedTrips = (suggestion.tripIds || [])
            .map(id => tripMap[id])
            .filter(Boolean);
          const isHighlighted = focusTripId && suggestion.tripIds?.includes(focusTripId);

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
