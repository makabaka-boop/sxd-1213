import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { TRIP_STATUS, PRIORITY } from '../db/indexedDB';
import { getStatusLabel, getPriorityLabel } from '../utils/checks';

const FilterPanel = ({ filters, onFilterChange, cities, dates, onClearFilters }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = 
    filters.city || 
    filters.date || 
    filters.minBudget !== '' || 
    filters.maxBudget !== '' || 
    filters.priority || 
    filters.status;

  return (
    <div className="filter-panel">
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="filter-title">
          <Filter size={18} />
          <span>筛选条件</span>
          {hasActiveFilters && <span className="filter-badge">已应用</span>}
        </div>
        <button className="btn-icon">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="filter-body">
          <div className="filter-grid">
            <div className="filter-item">
              <label>城市</label>
              <select
                value={filters.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              >
                <option value="">全部城市</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>日期</label>
              <select
                value={filters.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              >
                <option value="">全部日期</option>
                {dates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>最低预算</label>
              <input
                type="number"
                value={filters.minBudget}
                onChange={(e) => handleChange('minBudget', e.target.value)}
                placeholder="最低"
              />
            </div>

            <div className="filter-item">
              <label>最高预算</label>
              <input
                type="number"
                value={filters.maxBudget}
                onChange={(e) => handleChange('maxBudget', e.target.value)}
                placeholder="最高"
              />
            </div>

            <div className="filter-item">
              <label>优先级</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="">全部优先级</option>
                {Object.values(PRIORITY).map(p => (
                  <option key={p} value={p}>{getPriorityLabel(p)}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>确认状态</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="">全部状态</option>
                {Object.values(TRIP_STATUS).map(s => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-footer">
              <button className="btn btn-secondary btn-sm" onClick={onClearFilters}>
                <X size={14} />
                清除筛选
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
