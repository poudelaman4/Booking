import React from 'react';

export default function SummaryCards({ kpi, currencySymbol }) {
  const cards = [
    { title: 'Gross Revenue', value: kpi.revenueStr, label: 'Total Sales', color: 'text-emerald-600', fill: 'bg-emerald-500', border: 'border-emerald-100' },
    { title: 'Net Profit', value: kpi.profitStr, label: 'Estimated Margin', color: 'text-sky-600', fill: 'bg-sky-500', border: 'border-sky-100' },
    { title: 'Appointments', value: kpi.totalBookings, label: 'Bookings Volume', color: 'text-blue-600', fill: 'bg-blue-600', border: 'border-blue-100' },
    { title: 'Ticket Average', value: kpi.aovStr, label: 'Value Per Visit', color: 'text-purple-600', fill: 'bg-purple-600', border: 'border-purple-100' },
    { title: 'Top Specialist', value: kpi.topStaffName, label: 'Highest Frequency', color: 'text-amber-600', fill: 'bg-amber-500', border: 'border-amber-100' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(card => (
        <div 
          key={card.title} 
          className="group relative flex flex-col justify-between p-4 bg-white border border-slate-200/80 rounded-xl shadow-3xs transition-all duration-300 hover:-translate-y-0.5"
        >
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
              {card.title}
            </span>
            <span className="mt-2 text-xl font-black text-slate-900 tracking-tight font-mono block">
              {card.value}
            </span>
          </div>
          <span className={`inline-block text-[8px] font-black border px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-3.5 w-fit ${card.border} ${card.color}`}>
            {card.label}
          </span>
          
          {/* Signature sliding micro-line highlighter */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
            <div className={`h-full w-0 transition-all duration-300 ease-out group-hover:w-full ${card.fill}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
