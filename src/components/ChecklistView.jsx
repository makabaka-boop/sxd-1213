import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  DollarSign,
  Calendar,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { getStatusLabel } from '../utils/checks';
import { TRIP_STATUS } from '../db/indexedDB';

const ChecklistView = ({ trips, issues, budgetByDate, onViewTrip }) => {
  const pendingTrips = trips.filter(t => t.status === TRIP_STATUS.PENDING);
  const highBudgetTrips = trips.filter(t => t.status === TRIP_STATUS.HIGH_BUDGET);
  const errorIssues = issues.filter(i => i.severity === 'error');
  const warningIssues = issues.filter(i => i.severity === 'warning');

  const sortedDates = Object.keys(budgetByDate).sort();

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="checklist-view">
      <div className="checklist-header">
        <h3>出发前清单</h3>
        <p className="checklist-subtitle">需确认事项、预算异常和衔接风险</p>
      </div>

      <div className="checklist-summary">
        <div className="summary-card summary-warning">
          <div className="summary-icon">
            <AlertCircle size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-number">{pendingTrips.length}</div>
            <div className="summary-label">待确认行程</div>
          </div>
        </div>

        <div className="summary-card summary-orange">
          <div className="summary-icon">
            <DollarSign size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-number">{highBudgetTrips.length}</div>
            <div className="summary-label">预算偏高</div>
          </div>
        </div>

        <div className="summary-card summary-danger">
          <div className="summary-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-number">{errorIssues.length}</div>
            <div className="summary-label">严重问题</div>
          </div>
        </div>

        <div className="summary-card summary-info">
          <div className="summary-icon">
            <Info size={24} />
          </div>
          <div className="summary-content">
            <div className="summary-number">{warningIssues.length}</div>
            <div className="summary-label">警告提醒</div>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="checklist-section">
          <h4 className="section-title">
            <AlertTriangle size={18} />
            问题检查
          </h4>
          <div className="issue-list">
            {issues.map((issue, idx) => (
              <div key={idx} className={`issue-card issue-${issue.severity}`}>
                <div className="issue-header">
                  {getSeverityIcon(issue.severity)}
                  <span className="issue-date">{issue.date}</span>
                </div>
                <p className="issue-message">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="checklist-section">
        <h4 className="section-title">
          <Calendar size={18} />
          按日期预算汇总
        </h4>
        <div className="budget-summary-list">
          {sortedDates.length === 0 ? (
            <div className="empty-state">暂无行程数据</div>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="budget-date-item">
                <div className="budget-date-info">
                  <span className="budget-date">{date}</span>
                  <span className="budget-amount">¥{budgetByDate[date]}</span>
                </div>
                <div className="budget-date-trips">
                  {trips
                    .filter(t => t.date === date)
                    .map(trip => (
                      <div 
                        key={trip.id} 
                        className="budget-trip-item"
                        onClick={() => onViewTrip && onViewTrip(trip.id)}
                      >
                        <MapPin size={12} />
                        <span className="trip-name">{trip.locationName}</span>
                        <span className="trip-cost">¥{trip.estimatedCost}</span>
                        <ChevronRight size={12} />
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {pendingTrips.length > 0 && (
        <div className="checklist-section">
          <h4 className="section-title">
            <AlertCircle size={18} />
            待确认行程
          </h4>
          <div className="pending-trip-list">
            {pendingTrips.map(trip => (
              <div 
                key={trip.id} 
                className="pending-trip-item"
                onClick={() => onViewTrip && onViewTrip(trip.id)}
              >
                <div className="pending-trip-info">
                  <span className="pending-date">{trip.date}</span>
                  <span className="pending-location">{trip.locationName}</span>
                  <span className="pending-city">{trip.city}</span>
                </div>
                <span className="pending-status">
                  {getStatusLabel(trip.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistView;
