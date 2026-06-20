import { 
  Check, 
  Clock, 
  TrendingUp, 
  XCircle,
  Trash2,
  Copy
} from 'lucide-react';
import { TRIP_STATUS } from '../db/indexedDB';

const BatchActions = ({ 
  selectedCount, 
  totalCount,
  onBatchUpdateStatus, 
  onBatchDelete,
  onSelectAll,
  isAllSelected
}) => {
  if (totalCount === 0) return null;

  return (
    <div className="batch-actions-bar">
      <div className="batch-left">
        <label className="select-all">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
          />
          <span>全选</span>
        </label>
        <span className="selected-count">
          已选择 <strong>{selectedCount}</strong> / {totalCount} 条
        </span>
      </div>

      <div className="batch-right">
        <span className="batch-label">批量操作：</span>
        
        <button 
          className="btn btn-success btn-sm"
          onClick={() => onBatchUpdateStatus(TRIP_STATUS.CONFIRMED)}
          disabled={selectedCount === 0}
        >
          <Check size={14} />
          已确认
        </button>
        
        <button 
          className="btn btn-warning btn-sm"
          onClick={() => onBatchUpdateStatus(TRIP_STATUS.PENDING)}
          disabled={selectedCount === 0}
        >
          <Clock size={14} />
          待确认
        </button>
        
        <button 
          className="btn btn-orange btn-sm"
          onClick={() => onBatchUpdateStatus(TRIP_STATUS.HIGH_BUDGET)}
          disabled={selectedCount === 0}
        >
          <TrendingUp size={14} />
          预算偏高
        </button>
        
        <button 
          className="btn btn-danger btn-sm"
          onClick={() => onBatchUpdateStatus(TRIP_STATUS.CANCEL_CANDIDATE)}
          disabled={selectedCount === 0}
        >
          <XCircle size={14} />
          取消候选
        </button>

        <div className="batch-divider" />

        <button 
          className="btn btn-danger-outline btn-sm"
          onClick={onBatchDelete}
          disabled={selectedCount === 0}
        >
          <Trash2 size={14} />
          删除选中
        </button>
      </div>
    </div>
  );
};

export default BatchActions;
