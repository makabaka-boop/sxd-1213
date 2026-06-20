import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createEmptyTrip, TRIP_STATUS, PRIORITY } from '../db/indexedDB';

const AddTripForm = ({ onAdd, defaultDate = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(createEmptyTrip());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.locationName.trim()) return;
    
    onAdd(formData);
    setFormData(createEmptyTrip());
    setIsOpen(false);
  };

  const handleOpen = () => {
    setFormData({ ...createEmptyTrip(), date: defaultDate });
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <button className="btn btn-primary btn-add" onClick={handleOpen}>
        <Plus size={18} />
        添加行程
      </button>
    );
  }

  return (
    <div className="add-trip-form">
      <div className="form-header">
        <h4>添加新行程</h4>
        <button className="btn-icon" onClick={() => setIsOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>日期 *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>城市</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="如：北京"
            />
          </div>
          <div className="form-group">
            <label>地点名称 *</label>
            <input
              type="text"
              value={formData.locationName}
              onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
              placeholder="如：故宫博物院"
              required
            />
          </div>
          <div className="form-group">
            <label>预计花费 (元)</label>
            <input
              type="number"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>交通时间 (小时)</label>
            <input
              type="number"
              step="0.5"
              value={formData.transportTime}
              onChange={(e) => setFormData({ ...formData, transportTime: Number(e.target.value) })}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>优先级</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value={PRIORITY.HIGH}>高</option>
              <option value={PRIORITY.MEDIUM}>中</option>
              <option value={PRIORITY.LOW}>低</option>
            </select>
          </div>
          <div className="form-group">
            <label>确认状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              value={formData.alternativeNote}
              onChange={(e) => setFormData({ ...formData, alternativeNote: e.target.value })}
              placeholder="取消候选时的备选方案说明"
            />
          </div>
          <div className="form-group col-span-2">
            <label>备注</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="其他备注信息"
              rows={2}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>
            取消
          </button>
          <button type="submit" className="btn btn-primary">
            <Plus size={16} />
            添加行程
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTripForm;
