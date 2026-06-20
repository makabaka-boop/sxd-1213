import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Download, 
  Upload, 
  ListTodo, 
  Map, 
  Settings,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  getAllTrips, 
  addTrip, 
  updateTrip, 
  deleteTrip, 
  bulkUpdateTrips,
  bulkDeleteTrips,
  exportTrips,
  importTrips,
  createEmptyTrip,
  initDB,
  TRIP_STATUS
} from './db/indexedDB';
import { 
  runAllChecks, 
  groupTripsByDate, 
  calculateDailyBudget,
  sortTripsByOrder 
} from './utils/checks';
import FilterPanel from './components/FilterPanel';
import BatchActions from './components/BatchActions';
import DayTripList from './components/DayTripList';
import ChecklistView from './components/ChecklistView';
import AddTripForm from './components/AddTripForm';
import './App.css';

function App() {
  const [trips, setTrips] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({
    city: '',
    date: '',
    minBudget: '',
    maxBudget: '',
    priority: '',
    status: '',
  });
  const [dailyBudgetLimit, setDailyBudgetLimit] = useState(500);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await initDB();
      const data = await getAllTrips();
      setTrips(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const issues = useMemo(() => runAllChecks(trips, dailyBudgetLimit), [trips, dailyBudgetLimit]);
  const budgetByDate = useMemo(() => calculateDailyBudget(trips), [trips]);

  const cities = useMemo(() => {
    const citySet = new Set(trips.map(t => t.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [trips]);

  const dates = useMemo(() => {
    const dateSet = new Set(trips.map(t => t.date).filter(Boolean));
    return Array.from(dateSet).sort();
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (filters.city && trip.city !== filters.city) return false;
      if (filters.date && trip.date !== filters.date) return false;
      if (filters.priority && trip.priority !== filters.priority) return false;
      if (filters.status && trip.status !== filters.status) return false;
      if (filters.minBudget !== '' && trip.estimatedCost < Number(filters.minBudget)) return false;
      if (filters.maxBudget !== '' && trip.estimatedCost > Number(filters.maxBudget)) return false;
      return true;
    });
  }, [trips, filters]);

  const groupedFilteredTrips = useMemo(() => {
    const groups = groupTripsByDate(filteredTrips);
    const sortedDates = Object.keys(groups).sort();
    return sortedDates.map(date => ({
      date,
      trips: sortTripsByOrder(groups[date]),
    }));
  }, [filteredTrips]);

  const isAllSelected = useMemo(() => {
    if (filteredTrips.length === 0) return false;
    return filteredTrips.every(t => selectedIds.includes(t.id));
  }, [filteredTrips, selectedIds]);

  const handleAddTrip = useCallback(async (tripData) => {
    const dayTrips = trips.filter(t => t.date === tripData.date);
    const maxOrder = dayTrips.length > 0 
      ? Math.max(...dayTrips.map(t => t.order || 0)) 
      : -1;
    
    const newTrip = {
      ...tripData,
      order: maxOrder + 1,
    };
    
    const id = await addTrip(newTrip);
    const createdTrip = { ...newTrip, id };
    setTrips(prev => [...prev, createdTrip]);
  }, [trips]);

  const handleUpdateTrip = useCallback(async (tripData) => {
    await updateTrip(tripData);
    setTrips(prev => prev.map(t => t.id === tripData.id ? tripData : t));
  }, []);

  const handleDeleteTrip = useCallback(async (id) => {
    if (!confirm('确定要删除这条行程吗？')) return;
    await deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  }, []);

  const handleDuplicateTrip = useCallback(async (trip) => {
    const dayTrips = trips.filter(t => t.date === trip.date);
    const maxOrder = dayTrips.length > 0 
      ? Math.max(...dayTrips.map(t => t.order || 0)) 
      : -1;
    
    const newTrip = {
      ...trip,
      id: undefined,
      locationName: trip.locationName + ' (副本)',
      order: maxOrder + 1,
      status: TRIP_STATUS.PENDING,
    };
    
    const id = await addTrip(newTrip);
    const createdTrip = { ...newTrip, id };
    setTrips(prev => [...prev, createdTrip]);
  }, [trips]);

  const handleDuplicateDay = useCallback(async (date) => {
    const dayTrips = sortTripsByOrder(trips.filter(t => t.date === date));
    if (dayTrips.length === 0) return;

    const nextDate = prompt('请输入目标日期 (YYYY-MM-DD)：', date);
    if (!nextDate) return;

    const existingTrips = trips.filter(t => t.date === nextDate);
    const startOrder = existingTrips.length > 0 
      ? Math.max(...existingTrips.map(t => t.order || 0)) + 1 
      : 0;

    const newTrips = dayTrips.map((trip, index) => ({
      ...trip,
      id: undefined,
      date: nextDate,
      order: startOrder + index,
      status: TRIP_STATUS.PENDING,
    }));

    const createdTrips = [];
    for (const trip of newTrips) {
      const id = await addTrip(trip);
      createdTrips.push({ ...trip, id });
    }

    setTrips(prev => [...prev, ...createdTrips]);
  }, [trips]);

  const handleReorder = useCallback(async (updatedTrips) => {
    await bulkUpdateTrips(updatedTrips);
    setTrips(prev => {
      const updatedIds = new Set(updatedTrips.map(t => t.id));
      const otherTrips = prev.filter(t => !updatedIds.has(t.id));
      return [...otherTrips, ...updatedTrips];
    });
  }, []);

  const handleSelect = useCallback((id, checked) => {
    setSelectedIds(prev => 
      checked ? [...prev, id] : prev.filter(sid => sid !== id)
    );
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedIds(filteredTrips.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  }, [filteredTrips]);

  const handleBatchUpdateStatus = useCallback(async (status) => {
    const tripsToUpdate = trips
      .filter(t => selectedIds.includes(t.id))
      .map(t => ({ ...t, status }));
    
    await bulkUpdateTrips(tripsToUpdate);
    setTrips(prev => prev.map(t => 
      selectedIds.includes(t.id) ? { ...t, status } : t
    ));
  }, [trips, selectedIds]);

  const handleBatchDelete = useCallback(async () => {
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条行程吗？`)) return;
    await bulkDeleteTrips(selectedIds);
    setTrips(prev => prev.filter(t => !selectedIds.includes(t.id)));
    setSelectedIds([]);
  }, [selectedIds]);

  const handleExport = useCallback(async () => {
    const json = await exportTrips();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-budget-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const count = await importTrips(event.target.result);
          const allTrips = await getAllTrips();
          setTrips(allTrips);
          alert(`成功导入 ${count} 条行程`);
        } catch (err) {
          alert('导入失败：文件格式不正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      city: '',
      date: '',
      minBudget: '',
      maxBudget: '',
      priority: '',
      status: '',
    });
  }, []);

  const handleAddTripToDate = useCallback((date) => {
    const newTrip = {
      ...createEmptyTrip(),
      date,
      locationName: '新地点',
    };
    handleAddTrip(newTrip);
  }, [handleAddTrip]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllTrips();
    setTrips(data);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <Map size={28} />
            旅行预算行程编排
          </h1>
        </div>
        <div className="header-right">
          <button 
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('list')}
          >
            <ListTodo size={16} />
            行程列表
          </button>
          <button 
            className={`btn ${view === 'checklist' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('checklist')}
          >
            <ListTodo size={16} />
            出发前清单
          </button>
          <div className="header-divider" />
          <button className="btn btn-secondary" onClick={handleImport}>
            <Upload size={16} />
            导入
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} />
            导出
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh} title="刷新">
            <RefreshCw size={16} />
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowSettings(!showSettings)}
            title="设置"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <h4>每日预算上限 (元)</h4>
          <input
            type="number"
            value={dailyBudgetLimit}
            onChange={(e) => setDailyBudgetLimit(Number(e.target.value))}
            min="0"
          />
        </div>
      )}

      <main className="app-main">
        {view === 'list' ? (
          <>
            <div className="top-actions">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                cities={cities}
                dates={dates}
                onClearFilters={handleClearFilters}
              />
              <AddTripForm onAdd={handleAddTrip} />
            </div>

            <BatchActions
              selectedCount={selectedIds.length}
              totalCount={filteredTrips.length}
              onBatchUpdateStatus={handleBatchUpdateStatus}
              onBatchDelete={handleBatchDelete}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
            />

            <div className="trips-container">
              {groupedFilteredTrips.length === 0 ? (
                <div className="empty-state">
                  <Map size={48} />
                  <h3>暂无行程</h3>
                  <p>点击右上角「添加行程」开始规划你的旅行</p>
                </div>
              ) : (
                groupedFilteredTrips.map(({ date, trips: dayTrips }) => (
                  <DayTripList
                    key={date}
                    date={date}
                    trips={dayTrips}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onUpdate={handleUpdateTrip}
                    onDelete={handleDeleteTrip}
                    onDuplicate={handleDuplicateTrip}
                    onReorder={handleReorder}
                    onDuplicateDay={handleDuplicateDay}
                    onAddTrip={handleAddTripToDate}
                    issues={issues}
                    dailyBudget={budgetByDate[date]}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <ChecklistView
            trips={trips}
            issues={issues.filter(i => 
              i.severity !== 'info' || i.type === 'pending_confirmation'
            )}
            budgetByDate={budgetByDate}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>共 {trips.length} 条行程 · 数据保存在本地 IndexedDB</p>
      </footer>
    </div>
  );
}

export default App;
