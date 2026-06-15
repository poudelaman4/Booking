import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';

export default function OperationalCharts({ kpi, serviceAnalytics }) {
  return (
    /* 🌟 GRID MATRIX UNLOCKED: Enforces unified items-stretch mechanics across columns */
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      
      {/* CHART 1: Segmented Shift Ratios Distribution Progress Bar Spectrum */}
      <Card className="border border-slate-200/80 shadow-3xs h-full flex flex-col">
        <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/20 text-left">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Appointment Status Ratios
          </h2>
        </CardHeader>
        
        {/* 🌟 FLEX COLUMN ALIGNMENT: Forces content tracking spacing boundaries to expand uniformly */}
        <CardBody className="p-5 flex-1 flex flex-col justify-between gap-6">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex shadow-inner">
            {Object.values(kpi.ratios).map((r, i) => r.count > 0 && (
              <div 
                key={i} 
                className={`h-full ${r.color} transition-all duration-500`} 
                style={{ width: `${r.pct}%` }} 
                title={`${r.label}: ${Math.round(r.pct)}%`}
              />
            ))}
          </div>

          <div className="divide-y divide-slate-50 w-full">
            {Object.entries(kpi.ratios).map(([key, data]) => (
              <div key={key} className="flex items-center justify-between py-2 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${data.color}`} />
                  <span className="capitalize font-bold text-slate-800">{data.label}</span>
                </div>
                <div className="font-mono text-right flex items-center gap-2">
                  <span className="font-black text-slate-900">{data.count}</span>
                  <span className="text-[10px] text-slate-400 font-medium min-w-10">({Math.round(data.pct)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* CHART 2: Clean Service Performance & Profit Analytics Metrics Chart */}
      <Card className="border border-slate-200/80 shadow-3xs h-full flex flex-col">
        <CardHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/20 text-left">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Top Service Offerings By Demand
          </h2>
        </CardHeader>
        
        {/* 🌟 FLEX COLUMN ALIGNMENT: Perfectly balances top 3 services spacing mapping parameters */}
        <CardBody className="p-5 flex-1 flex flex-col justify-between gap-4">
          {serviceAnalytics.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 text-center py-10 my-auto">No service volume data recorded.</p>
          ) : (
            serviceAnalytics.map((srv, idx) => (
              <div key={idx} className="space-y-1.5 text-left text-xs font-semibold w-full">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-bold text-slate-800 truncate max-w-xs">{srv.name}</span>
                  <span className="font-mono text-[10px] text-slate-400 font-medium">{srv.count} sessions</span>
                </div>
                {/* Smooth horizontal progress performance bars */}
                <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden relative shadow-inner">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 origin-left"
                    style={{ width: `${srv.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

    </div>
  );
}
