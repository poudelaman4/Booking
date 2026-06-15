import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../api/client';
import CalendarHeader from './components/CalendarHeader';
import MonthGrid from './components/MonthGrid';
import DayTimeline from './components/DayTimeline';

export default function CalendarView() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // System State Configuration Anchors
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.request('appointments'),
      apiClient.request('employees'),
    ])
      .then(([a, e]) => {
        setAppointments(Array.isArray(a) ? a : []);
        setEmployees(Array.isArray(e) ? e : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 🧠 FIXED FUZZY ENGINE: Splits queries into separate search words to support full composite names smoothly!
  const filteredEmployees = useMemo(() => {
    const queryClean = searchQuery.toLowerCase().trim();
    if (queryClean.length < 1) return employees;

    // Split "Aman Sharma" into an array -> ["aman", "sharma"]
    const queryParts = queryClean.split(/\s+/);

    return employees.filter(e => {
      const firstName = (e.first_name || '').toLowerCase();
      const lastName = (e.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;

      // Ensure every single typed word matches somewhere inside the employee's name string
      return queryParts.every(part => 
        firstName.includes(part) || 
        lastName.includes(part) || 
        fullName.includes(part)
      );
    });
  }, [employees, searchQuery]);

  const activeEmployeeIds = useMemo(
    () => filteredEmployees.map(e => String(e.id)),
    [filteredEmployees]
  );

  // 📊 MEMOIZED APPOINTMENT CONTEXT DATA STREAMS FILTER
  const currentViewAppointments = useMemo(() => {
    if (selectedDate) {
      return appointments.filter(a => {
        if (!a.start_time) return false;
        const dateSegment = a.start_time.split(' ')[0];
        if (dateSegment !== selectedDate) return false;
        return activeEmployeeIds.includes(String(a.employee_id));
      });
    }

    if (searchQuery.trim().length > 0) {
      return appointments.filter(a => activeEmployeeIds.includes(String(a.employee_id)));
    }

    return appointments;
  }, [appointments, selectedDate, activeEmployeeIds, searchQuery]);

  // Dropdown option click handler
  const handleSelectStaffQueryString = (fullNameText) => {
    setSearchQuery(fullNameText);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 font-sans text-left pr-6">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading calendar metrics…</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-sans text-left text-slate-900 py-6 pr-6 animate-fade-in">
      <CalendarHeader
        selectedDate={selectedDate}
        currentYear={currentYear}
        currentMonth={currentMonth}
        searchQuery={searchQuery}
        filteredEmployees={filteredEmployees}
        onSearchChange={setSearchQuery}
        onYearChange={setCurrentYear}
        onMonthChange={setCurrentMonth}
        onSelectStaff={handleSelectStaffQueryString}
        onBack={() => {
          setSelectedDate(null);
          setSearchQuery('');
        }}
        onSetToday={() => {
          const now = new Date();
          setCurrentYear(now.getFullYear());
          setCurrentMonth(now.getMonth());
          setSelectedDate(null);
        }}
      />

      {!selectedDate ? (
        <MonthGrid
          appointments={currentViewAppointments}
          year={currentYear}
          month={currentMonth}
          onSelectDay={setSelectedDate}
        />
      ) : (
        <DayTimeline
          appointments={currentViewAppointments}
          employees={filteredEmployees}
        />
      )}
    </div>
  );
}
