import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiClient } from '../../api/client';
import StaffListColumn from './components/StaffListColumn';
import ShiftScheduleColumn from './components/ShiftScheduleColumn';
import SkillsBasketColumn from './components/SkillsBasketColumn';

export default function StaffView() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]); 
  
  // Storage arrays for the active selected specialist's meta parameters
  const [selectedEmp, setSelectedEmp] = useState(null); 
  const [weeklySchedule, setWeeklySchedule] = useState([]); 
  const [assignedServices, setAssignedServices] = useState([]); 
  
  // Universal Header Search Parameter State
  const [searchQuery, setSearchQuery] = useState('');
  const [syncTimestamp, setSyncTimestamp] = useState(() => Date.now());

  // 🧠 UI TOAST NOTIFICATION HOOK SYSTEM
  const [toast, setToast] = useState({ isVisible: false, type: 'success', message: '' });
  const toastTimeoutRef = useRef(null);

  const showToastNotification = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ isVisible: true, type, message });
    
    // Automatically fade out the banner after 3 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ isVisible: false, type: 'success', message: '' });
    }, 3000);
  };

  // Clean up timeout listeners on unmount
  useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  const DAYS = useMemo(() => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);

  const refreshCatalogData = async () => {
    try {
      const emps = await apiClient.request('employees');
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch (err) {
      console.error("Failed refreshing records:", err);
    }
  };

  useEffect(() => {
    Promise.all([
      apiClient.request('employees'),
      apiClient.request('services'),
      apiClient.request('categories') 
    ])
      .then(([emps, srvs, cats]) => {
        setEmployees(Array.isArray(emps) ? emps : []);
        setServices(Array.isArray(srvs) ? srvs : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEmp) {
      setWeeklySchedule([]);
      setAssignedServices([]);
      return;
    }

    const fetchEmployeeMetaDetails = async () => {
      try {
        const [linkedServicesData, hoursData] = await Promise.all([
          apiClient.request(`employees/${selectedEmp.id}/services`),
          apiClient.request(`working-hours/employee/${selectedEmp.id}`)
        ]);

        setAssignedServices(Array.isArray(linkedServicesData) ? linkedServicesData.map(s => s.id) : []); 

        const fullWeekBlueprint = DAYS.map((_, idx) => {
          const match = Array.isArray(hoursData) ? hoursData.find(h => parseInt(h.day_of_week) === idx) : null;
          return match ? { ...match, day_of_week: idx } : {
            day_of_week: idx,
            start_time: '09:00:00',
            end_time: '17:00:00',
            break_start: null,
            break_end: null,
            is_day_off: 0 
          };
        });

        setWeeklySchedule(fullWeekBlueprint); 
      } catch (err) {
        console.error("Roster payload fetch failure:", err);
      }
    };

    fetchEmployeeMetaDetails();
  }, [selectedEmp, syncTimestamp, DAYS]);

  const filteredEmployeesList = useMemo(() => {
    const queryClean = searchQuery.toLowerCase().trim();
    if (!queryClean) return employees;
    return employees.filter(emp => {
      const first = (emp.first_name || '').toLowerCase();
      const last = (emp.last_name || '').toLowerCase();
      return first.includes(queryClean) || last.includes(queryClean);
    });
  }, [employees, searchQuery]);

  const handleSaveWeeklySchedule = async (updatedSchedule) => {
    if (!selectedEmp) return;
    try {
      const sanitizedSchedules = updatedSchedule.map(item => ({
        day_of_week: parseInt(item.day_of_week, 10),
        start_time: item.start_time || '09:00:00',
        end_time: item.end_time || '17:00:00',
        break_start: item.break_start || null,
        break_end: item.break_end || null,
        is_day_off: parseInt(item.is_day_off, 10) === 1 ? 1 : 0
      }));

      await apiClient.request(`working-hours/employee/${selectedEmp.id}`, {
        method: 'POST',
        body: JSON.stringify({ schedules: sanitizedSchedules }) 
      });
      
      showToastNotification('success', 'Weekly hour matrices synchronized successfully.');
      setSyncTimestamp(Date.now());
    } catch (err) {
      showToastNotification('error', `Save Blocked: ${err.message}`);
    }
  };

  const handleToggleSkillCapability = async (serviceId) => {
    if (!selectedEmp) return;
    try {
      const isAssigned = assignedServices.includes(serviceId); 
      const updatedIds = isAssigned 
        ? assignedServices.filter(id => id !== serviceId) 
        : [...assignedServices, serviceId];
      
      setAssignedServices(updatedIds);
      const payload = updatedIds.map(id => ({ service_id: id })); 
      await apiClient.request(`employees/${selectedEmp.id}/services`, {
        method: 'POST',
        body: JSON.stringify({ services: payload }) 
      });
      
      showToastNotification('success', 'Capabilities adjusted in real-time.');
      setSyncTimestamp(Date.now());
    } catch (err) {
      showToastNotification('error', `Skill update failure: ${err.message}`);
    }
  };

  const activeStaffMemberName = useMemo(() => {
    return selectedEmp ? `${selectedEmp.first_name} ${selectedEmp.last_name || ''}`.trim() : 'Specialist';
  }, [selectedEmp]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 font-sans text-left pr-6">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Assembling master roster coordinator matrices...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans text-left text-slate-900 py-6 pr-6 animate-fade-in flex flex-col relative min-h-screen">
      
      <header className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Roster Coordinator</h1>
        </div>
        <div className="relative shrink-0">
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search team member..."
            className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-lg outline-none w-56 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400"
          />
        </div>
      </header>

      {/* 🌟 USER REFACTOR FIXED: Clean, flat triple-column matrix layout restored completely! */}
      <div className="w-full overflow-x-auto scrollbar-thin rounded-xl border border-slate-200 bg-white shadow-xs flex select-none min-h-125">
        <StaffListColumn employees={filteredEmployeesList} selectedEmp={selectedEmp} onSelect={setSelectedEmp} onRefreshData={refreshCatalogData} />
        <ShiftScheduleColumn 
          schedule={weeklySchedule} isActiveSelected={!!selectedEmp} staffName={activeStaffMemberName} 
          onUpdateField={(dayIdx, field, val) => { setWeeklySchedule(weeklySchedule.map(s => s.day_of_week === dayIdx ? { ...s, [field]: val } : s)); }} 
          onSave={() => handleSaveWeeklySchedule(weeklySchedule)} 
        />
        <SkillsBasketColumn services={services} assignedServices={assignedServices} categories={categories} isActiveSelected={!!selectedEmp} staffName={activeStaffMemberName} onToggleSkill={handleToggleSkillCapability} />
      </div>

      {/* ========================================================
          🔮 HIGH-END MATTE FLOATING NOTIFICATION SLATE TOAST BANNER
          ======================================================== */}
      <div 
        className={`fixed bottom-6 right-6 z-50 px-4 py-3 border rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform font-sans ${toast.isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'} ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}
      >
        <div className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[10px] font-black ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? '✓' : '✕'}
        </div>
        <span className="text-xs font-bold tracking-tight select-none">
          {toast.message}
        </span>
      </div>

    </div>
  );
}
