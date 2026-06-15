import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../api/client';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

import SummaryCards from './components/SummaryCards';
import OperationalCharts from './components/OperationalCharts';

export default function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    Promise.all([
      apiClient.request('appointments'),
      apiClient.request('employees'),
    ])
      .then(([appts, emps]) => {
        setAppointments(Array.isArray(appts) ? appts : []);
        setEmployees(Array.isArray(emps) ? emps : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      map[e.id] = `${e.first_name || ''} ${e.last_name || ''}`.trim();
    });
    return map;
  }, [employees]);

  // 🧠 MASTER BI PROCESSING COUPLER
  const analytics = useMemo(() => {
    const totalCount = appointments.length;
    const confirmedList = appointments.filter(a => a.status === 'confirmed');
    const pendingList = appointments.filter(a => a.status === 'pending');
    const completedList = appointments.filter(a => a.status === 'completed');
    const cancelledList = appointments.filter(a => a.status === 'cancelled');

    const grossRevenue = appointments.reduce((sum, a) => a.status === 'cancelled' ? sum : sum + parseFloat(a.price || 0), 0);
    const netProfit = grossRevenue * 0.75; 

    const aov = (confirmedList.length + completedList.length) > 0 
      ? grossRevenue / (confirmedList.length + completedList.length) 
      : 0;

    const assignmentFreq = {};
    appointments.forEach(a => { 
      if (a.employee_id) assignmentFreq[a.employee_id] = (assignmentFreq[a.employee_id] || 0) + 1; 
    });
    const sortedStaff = Object.entries(assignmentFreq).sort((a, b) => b[1] - a[1]);
    const topStaffId = sortedStaff[0]?.[0];
    const topStaff = employees.find(e => String(e.id) === String(topStaffId));

    // 🌟 THE CRITICAL FIX: Loop deep inside your nested multi-service arrays
    const serviceFreq = {};
    appointments.forEach(a => {
      if (a.status === 'cancelled') return;
      
      if (a.notes && a.notes.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(a.notes);
          if (parsed && Array.isArray(parsed.services)) {
            parsed.services.forEach(s => {
              if (s && s.name) {
                serviceFreq[s.name] = (serviceFreq[s.name] || 0) + 1;
              }
            });
          }
        } catch (e) {}
      } else if (a.service_name) {
        serviceFreq[a.service_name] = (serviceFreq[a.service_name] || 0) + 1;
      }
    });

    const maxServiceCount = Math.max(...Object.values(serviceFreq), 1);
    
    // 🌟 ATTENTION TO DETAIL FIX: Displays up to the top 3 high-demand items dynamically
    const serviceAnalytics = Object.entries(serviceFreq)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / maxServiceCount) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      kpi: {
        revenueStr: `Rs. ${grossRevenue.toFixed(2)}`,
        profitStr: `Rs. ${netProfit.toFixed(2)}`,
        aovStr: `Rs. ${aov.toFixed(2)}`,
        totalBookings: totalCount,
        topStaffName: topStaff ? `${topStaff.first_name} ${topStaff.last_name || ''}`.trim() : 'John Doe',
        ratios: {
          confirmed: { label: 'Confirmed', count: confirmedList.length, pct: totalCount > 0 ? (confirmedList.length / totalCount) * 100 : 0, color: 'bg-blue-500' },
          completed: { label: 'Completed', count: completedList.length, pct: totalCount > 0 ? (completedList.length / totalCount) * 100 : 0, color: 'bg-emerald-500' },
          pending:   { label: 'Pending',   count: pendingList.length,   pct: totalCount > 0 ? (pendingList.length / totalCount) * 100 : 0, color: 'bg-amber-500' },
          cancelled: { label: 'Cancelled', count: cancelledList.length, pct: totalCount > 0 ? (cancelledList.length / totalCount) * 100 : 0, color: 'bg-rose-500' }
        }
      },
      serviceAnalytics
    };
  }, [appointments, employees]);

  const upcomingAgenda = useMemo(() => {
    return [...appointments]
      .filter(a => ['confirmed', 'pending'].includes(a.status))
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
      .slice(0, 5);
  }, [appointments]);

  const getServiceName = (notes) => {
    if (!notes) return 'Appointment Session';
    try {
      const parsed = JSON.parse(notes);
      if (parsed && Array.isArray(parsed.services)) {
        return parsed.services.map(s => s.name).join(', ');
      }
    } catch (e) {}
    return 'Appointment Session';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 font-sans text-left pr-6">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Compiling executive analytics matrices...</p>
      </div>
    );
  }
  return (
    <div className="w-full space-y-6 py-6 text-slate-900 font-sans text-left pr-6 animate-fade-in select-none">
      
      {/* ================= HEADER OVERVIEW ================= */}
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
          Dashboard Overview
        </h1>
      </header>

      {/* Component 1: KPI Summary Data Cards Block */}
      <SummaryCards kpi={analytics.kpi} />

      {/* Component 2: Ratios and Dynamically Bound Multi-Service Performance Bars */}
      <OperationalCharts kpi={analytics.kpi} serviceAnalytics={analytics.serviceAnalytics} />

      {/* Component 3: High-Density Polished Upcoming Appointments Ledger Table */}
      <Card className="border border-slate-200 rounded-xl shadow-3xs overflow-hidden">
        <CardHeader className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/20">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Upcoming Appointments
          </h2>
          <Button size="sm" variant="secondary" className="h-7 text-[10px] uppercase font-black tracking-wider px-2.5">
            View All
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest select-none">
                  <th className="py-2.5 px-6 text-left">Time Frame</th>
                  <th className="py-2.5 px-6 text-left">Service Offerings</th>
                  <th className="py-2.5 px-6 text-left">Specialist Assignment</th>
                  <th className="py-2.5 px-6 text-right">Settlement Price</th>
                  <th className="py-2.5 px-6 text-right">Roster Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {upcomingAgenda.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      No appointments currently scheduled inside this ledger book.
                    </td>
                  </tr>
                ) : (
                  upcomingAgenda.map(a => {
                    const isPending = a.status === 'pending';
                    
                    // 🌟 EXPLEMENTARY ATTENTION TO DETAIL TIME EXTRACTOR FIX
                    const formatTime = (tStr) => {
                      if (!tStr || !tStr.includes(' ')) return '--:--';
                      const cleanTime = tStr.split(' ')[1];
                      const parts = cleanTime.split(':');
                      if (parts.length < 2) return '--:--';
                      
                      const hour = parseInt(parts[0], 10);
                      const minute = parts[1];
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                      
                      return `${displayHour}:${minute} ${ampm}`;
                    };

                    return (
                      <tr key={a.id} className="group relative hover:bg-slate-50/30 transition-colors text-xs text-slate-700">
                        <td className="py-3.5 px-6 font-mono font-black text-slate-900 text-left whitespace-nowrap">
                          {formatTime(a.start_time)}
                        </td>
                        <td className="py-3.5 px-6 text-left font-black text-slate-800 truncate max-w-xs">
                          {getServiceName(a.notes)}
                        </td>
                        <td className="py-3.5 px-6 text-left font-bold text-slate-500 truncate">
                          👤 {employeeMap[a.employee_id] || 'John Doe'}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                          Rs. {parseFloat(a.price || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap relative">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                            isPending ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'
                          }`}>
                            {a.status}
                          </span>
                          {/* Left-to-right full width hover accent line indicator */}
                          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

    </div>
  );
}
