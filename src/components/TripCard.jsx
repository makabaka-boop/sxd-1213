import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  X,
  MapPin,
  Clock,
  DollarSign,
  Flag,
  AlertCircle
} from 'lucide-react';
import { TRIP_STATUS, PRIORITY } from '../db/indexedDB';
import { getStatusLabel, getPriorityLabel } from '../utils/checks';

const TripCard = ({ 
  trip, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  issues = [],
  disabled = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(trip);

  useEffect(() => {
    if (!isEditing) {
      setEditData(trip);
    } else {
      setEditData(prev => ({ ...trip, ...prev }));
    }
  }, [trip]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(trip);
    setIsEditing(false);
  };

  const statusColors = {
    [TRIP_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [TRIP_STATUS.CONFIRMED]: 'bg-green-100 text-green-800 border-green-300',
    [TRIP_STATUS.HIGH_BUDGET]: 'bg-orange-100 text-orange-800 border-orange-300',
    [TRIP_STATUS.CANCEL_CANDIDATE]: 'bg-red-100 text-red-800 border-red-300',
  };

  const priorityColors = {
    [PRIORITY.HIGH]: 'text-red-600',
    [PRIORITY.MEDIUM]: 'text-yellow-600',
    [PRIORITY.LOW]: 'text-green-600',
  };

  const tripIssues = issues.filter(issue => 
    issue.tripIds && issue.tripIds.includes(trip.id)
  );

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="trip-card editing">
        <div className="trip-card-header">
          <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={16} />
          </div>
          <div className="edit-actions">
            <button className="btn-icon btn-save" onClick={handleSave}>
              <Check size={16} />
            </button>
            <button className="btn-icon btn-cancel" onClick={handleCancel}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="trip-form-grid">
          <div className="form-group">
            <label>日期</label>
            <input
              type="date"
              value={editData.date || ''}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>城市</label>
            <input
              type="text"
              value={editData.city || ''}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              placeholder="如：北京"
            />
          </div>
          <div className="form-group">
            <label>地点名称</label>
            <input
              type="text"
              value={editData.locationName || ''}
              onChange={(e) => setEditData({ ...editData, locationName: e.target.value })}
              placeholder="如：故宫"
            />
          </div>
          <div className="form-group">
            <label>预计花费 (元)</label>
            <input
              type="number"
              value={editData.estimatedCost || 0}
              onChange={(e) => setEditData({ ...editData, estimatedCost: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>交通时间 (小时)</label>
            <input
              type="number"
              step="0.5"
              value={editData.transportTime || 0}
              onChange={(e) => setEditData({ ...editData, transportTime: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>优先级</label>
            <select
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
            >
              <option value={PRIORITY.HIGH}>高</option>
              <option value={PRIORITY.MEDIUM}>中</option>
              <option value={PRIORITY.LOW}>低</option>
            </select>
          </div>
          <div className="form-group">
            <label>确认状态</label>
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            >
              <option value={TRIP_STATUS.PENDING}>待确认</option>
              <option value={TRIP_STATUS.CONFIRMED}>已确认</option>
              <option value={TRIP_STATUS.HIGH_BUDGET}>预算偏高</option>
              <option value={TRIP_STATUS.CANCEL_CANDIDATE}>取消候选</option>
            </select>
          </div>
          <div className="form-group col-span-2">
            <label>备选说明</label>
            <input
              type="text"
              value={editData.alternativeNote || ''}
              onChange={(e) => setEditData({ ...editData, alternativeNote: e.target.value })}
              placeholder="取消候选时的备选方案"
            />
          </div>
          <div className="form-group col-span-2">
            <label>备注</label>
            <textarea
              value={editData.remark || ''}
              onChange={(e) => setEditData({ ...editData, remark: e.target.value })}
              placeholder="其他备注信息"
              rows={2}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`trip-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <div className="trip-card-header">
        <div className="trip-card-left">
          <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={16} />
          </div>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(trip.id, e.target.checked)}
            className="trip-checkbox"
          />
          <span className={`status-badge ${statusColors[trip.status] || ''}`}>
            {getStatusLabel(trip.status)}
          </span>
        </div>
        <div className="trip-actions">
          <button className="btn-icon" onClick={() => onDuplicate(trip)} title="复制">
            <Copy size={14} />
          </button>
          <button className="btn-icon" onClick={() => setIsEditing(true)} title="编辑">
            <Edit2 size={14} />
          </button>
          <button className="btn-icon btn-danger" onClick={() => onDelete(trip.id)} title="删除">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="trip-card-body">
        <h4 className="trip-title">{trip.locationName || '未命名地点'}</h4>
        
        <div className="trip-info-row">
          <div className="trip-info-item">
            <MapPin size={14} className="info-icon" />
            <span>{trip.city || '未设置'}</span>
          </div>
          <div className="trip-info-item">
            <DollarSign size={14} className="info-icon" />
            <span>¥{trip.estimatedCost || 0}</span>
          </div>
          <div className="trip-info-item">
            <Clock size={14} className="info-icon" />
            <span>{trip.transportTime || 0}h</span>
          </div>
          <div className="trip-info-item">
            <Flag size={14} className={`info-icon ${priorityColors[trip.priority] || ''}`} />
            <span className={priorityColors[trip.priority] || ''}>
              {getPriorityLabel(trip.priority)}优先级
            </span>
          </div>
        </div>

        {trip.alternativeNote && (
          <div className="trip-note">
            <span className="note-label">备选：</span>
            {trip.alternativeNote}
          </div>
        )}

        {trip.remark && (
          <div className="trip-remark">
            <span className="note-label">备注：</span>
            {trip.remark}
          </div>
        )}

        {tripIssues.length > 0 && (
          <div className="trip-issues">
            {tripIssues.map((issue, idx) => (
              <div key={idx} className={`issue-item issue-${issue.severity}`}>
                <AlertCircle size={12} />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripCard;
