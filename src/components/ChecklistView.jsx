import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  DollarSign,
  Calendar,
  MapPin,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { getStatusLabel } from '../utils/checks';
import { TRIP_STATUS } from '../db/indexedDB';

const ChecklistView = ({ 
  trips, 
  issues, 
  budgetByDate, 
  onViewTrip,
  optimizationSummary,
  onGoToOptimization,
  confirmationProgress = {},
  riskSummary = {},
  dayMeta = {},
  onViewDate,
}) => {
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

      <div className="checklist-section optimization-checklist-section">
        <h4 className="section-title">
          <Sparkles size={18} />
          优化方案汇总
        </h4>
        <p className="optimization-checklist-desc">
          基于每日预算、交通时长、优先级、确认状态与跨城衔接风险自动识别的优化建议
        </p>
        <div className="optimization-checklist-stats">
          <div className="opt-stat-chip opt-stat-error">
            <AlertTriangle size={14} />
            <span className="opt-stat-num">{optimizationSummary?.error || 0}</span>
            <span className="opt-stat-text">严重</span>
          </div>
          <div className="opt-stat-chip opt-stat-warning">
            <AlertCircle size={14} />
            <span className="opt-stat-num">{optimizationSummary?.warning || 0}</span>
            <span className="opt-stat-text">可调整</span>
          </div>
          <div className="opt-stat-chip opt-stat-info">
            <Info size={14} />
            <span className="opt-stat-num">{optimizationSummary?.info || 0}</span>
            <span className="opt-stat-text">提示</span>
          </div>
          <div className="opt-stat-chip opt-stat-total">
            <Sparkles size={14} />
            <span className="opt-stat-num">{optimizationSummary?.total || 0}</span>
            <span className="opt-stat-text">合计</span>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onGoToOptimization}>
          <Sparkles size={14} />
          查看 / 生成优化方案
          <ChevronRight size={14} />
        </button>
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
          每日进度总览
        </h4>
        <div className="budget-summary-list">
          {sortedDates.length === 0 ? (
            <div className="empty-state">暂无行程数据</div>
          ) : (
            sortedDates.map(date => {
              const progress = confirmationProgress[date] || {
                total: 0,
                confirmed: 0,
                pending: 0,
                progressPercent: 0,
              };
              const risk = riskSummary[date] || {
                count: 0,
                maxSeverity: null,
                risks: [],
              };
              const meta = dayMeta[date];
              const hasReview = !!(meta && meta.reviewNote && meta.reviewNote.trim());

              return (
                <div key={date} className="budget-date-item">
                  <div
                    className="budget-date-info clickable"
                    onClick={() => onViewDate && onViewDate(date)}
                    title="点击跳转到该日期"
                  >
                    <div className="budget-date-header">
                      <span className="budget-date">{date}</span>
                      <div className="budget-date-right">
                        <span className="budget-amount">¥{budgetByDate[date]}</span>
                        <ChevronRight size={14} className="budget-arrow" />
                      </div>
                    </div>

                    <div className="checklist-progress-row">
                      <div className="checklist-progress-item">
                        <CheckCircle2 size={13} className="icon-success" />
                        <span>{progress.confirmed}</span>
                        <span className="progress-sub">已确认</span>
                      </div>
                      <div className="checklist-progress-item">
                        <Clock size={13} className="icon-pending" />
                        <span>{progress.pending}</span>
                        <span className="progress-sub">待处理</span>
                      </div>
                      <div className="checklist-progress-bar-wrap">
                        <div className="checklist-progress-bar">
                          <div
                            className="checklist-progress-fill"
                            style={{ width: `${progress.progressPercent}%` }}
                          />
                        </div>
                        <span className="progress-percent">{progress.progressPercent}%</span>
                      </div>
                    </div>

                    {risk.count > 0 && (
                      <div className="checklist-risk-row">
                        {risk.risks.map((r, idx) => (
                          <span
                            key={idx}
                            className={`checklist-risk-tag checklist-risk-${r.severity}`}
                          >
                            {r.severity === 'error' ? (
                              <AlertTriangle size={11} />
                            ) : (
                              <AlertCircle size={11} />
                            )}
                            {r.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="checklist-review-row">
                      <FileText size={13} className={hasReview ? 'icon-note' : 'icon-muted'} />
                      {hasReview ? (
                        <span className="review-preview" title={meta.reviewNote}>
                          {meta.reviewNote.length > 60
                            ? meta.reviewNote.substring(0, 60) + '...'
                            : meta.reviewNote}
                        </span>
                      ) : (
                        <span className="review-hint">暂无复盘备注，点击日期添加</span>
                      )}
                    </div>
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
              );
            })
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
