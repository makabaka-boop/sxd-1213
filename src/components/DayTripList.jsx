import { useMemo } from 'react';
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
import { Calendar, Copy, DollarSign, Clock, Plus } from 'lucide-react';
import TripCard from './TripCard';
import { sortTripsByOrder } from '../utils/checks';

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

  const totalTransportTime = sortedTrips.reduce(
    (sum, trip) => sum + (trip.transportTime || 0),
    0
  );

  const dayIssues = issues.filter(issue => issue.date === date);

  return (
    <div className="day-trip-group">
      <div className="day-header">
        <div className="day-title">
          <Calendar size={20} />
          <span className="date-text">{date}</span>
          <span className="trip-count">{sortedTrips.length} 项</span>
        </div>
        <div className="day-stats">
          <div className="day-stat">
            <DollarSign size={14} />
            <span>¥{dailyBudget || 0}</span>
          </div>
          <div className="day-stat">
            <Clock size={14} />
            <span>{totalTransportTime}h</span>
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
