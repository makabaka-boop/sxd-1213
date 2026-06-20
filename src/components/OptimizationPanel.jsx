import { useMemo } from 'react';
import {
  Sparkles,
  Wand2,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  ListTodo,
  CheckCircle2,
} from 'lucide-react';
import DaySuggestionList from './DaySuggestionList';
import { summarizeSuggestions } from '../utils/checks';

const OptimizationPanel = ({
  trips,
  suggestions,
  generated,
  adoptedCount,
  onGenerate,
  onAdopt,
  onRegenerate,
  onGoToList,
  onClearFocus,
  focusTripId,
  dailyBudgetLimit,
  confirmationProgress = {},
  riskSummary = {},
  dayMeta = {},
  onViewDate,
}) => {
  const summary = useMemo(() => summarizeSuggestions(suggestions), [suggestions]);

  const grouped = useMemo(() => {
    const map = {};
    suggestions.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return Object.keys(map)
      .sort()
      .map(date => ({ date, suggestions: map[date] }));
  }, [suggestions]);

  if (!generated) {
    return (
      <div className="optimization-panel" onClick={(e) => e.target === e.currentTarget && onClearFocus && onClearFocus()}>
        <div className="optimization-hero">
          <div className="optimization-hero-icon">
            <Wand2 size={40} />
          </div>
          <h3>行程优化方案</h3>
          <p className="optimization-hero-desc">
            基于每日预算、交通时长、优先级、确认状态与跨城市衔接风险，
            一键生成按日期分组的优化建议，支持将建议直接采纳到对应行程的状态或备注。
          </p>
          <div className="optimization-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-label">当前每日预算上限</span>
              <span className="hero-stat-value">¥{dailyBudgetLimit}</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">待分析行程</span>
              <span className="hero-stat-value">{trips.length} 条</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-label">已识别建议</span>
              <span className="hero-stat-value">{summary.total} 条</span>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={onGenerate} disabled={trips.length === 0}>
            <Sparkles size={18} />
            一键生成优化方案
          </button>
          {trips.length === 0 && (
            <p className="optimization-hero-hint">请先在行程列表中添加行程</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="optimization-panel" onClick={(e) => e.target === e.currentTarget && onClearFocus && onClearFocus()}>
      <div className="optimization-header">
        <div className="optimization-header-left">
          <h3>
            <Sparkles size={20} />
            行程优化方案
          </h3>
          <p className="optimization-subtitle">
            按日期分组的优化建议 · 已采纳 {adoptedCount} 条
          </p>
        </div>
        <div className="optimization-header-actions">
          <button className="btn btn-outline btn-sm" onClick={onGoToList}>
            <ListTodo size={14} />
            返回行程列表
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onRegenerate}>
            <RefreshCw size={14} />
            重新生成
          </button>
        </div>
      </div>

      <div className="optimization-summary">
        <div className="opt-summary-card opt-summary-error">
          <div className="opt-summary-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="opt-summary-content">
            <div className="opt-summary-number">{summary.error}</div>
            <div className="opt-summary-label">严重问题</div>
          </div>
        </div>
        <div className="opt-summary-card opt-summary-warning">
          <div className="opt-summary-icon">
            <AlertCircle size={22} />
          </div>
          <div className="opt-summary-content">
            <div className="opt-summary-number">{summary.warning}</div>
            <div className="opt-summary-label">可调整项</div>
          </div>
        </div>
        <div className="opt-summary-card opt-summary-info">
          <div className="opt-summary-icon">
            <Info size={22} />
          </div>
          <div className="opt-summary-content">
            <div className="opt-summary-number">{summary.info}</div>
            <div className="opt-summary-label">提示提醒</div>
          </div>
        </div>
        <div className="opt-summary-card opt-summary-total">
          <div className="opt-summary-icon">
            <CheckCircle2 size={22} />
          </div>
          <div className="opt-summary-content">
            <div className="opt-summary-number">{summary.total}</div>
            <div className="opt-summary-label">建议总数</div>
          </div>
        </div>
      </div>

      <div className="optimization-list">
        {grouped.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={48} />
            <h3>暂无优化建议</h3>
            <p>当前行程安排良好，未发现预算超限、交通超限或衔接风险</p>
          </div>
        ) : (
          grouped.map(({ date, suggestions: daySuggestions }) => (
            <DaySuggestionList
              key={date}
              date={date}
              suggestions={daySuggestions}
              trips={trips}
              onAdopt={onAdopt}
              onClearFocus={onClearFocus}
              focusTripId={focusTripId}
              confirmationProgress={confirmationProgress[date]}
              riskSummary={riskSummary[date]}
              dayMeta={dayMeta[date]}
              onViewDate={onViewDate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default OptimizationPanel;
