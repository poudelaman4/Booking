import React from 'react';

export default function SettingsNavColumn({ activeSection, onSelectSection }) {
  // Navigation blocks array mapping cleanly to your config sectors blueprint
  const menuSections = [
    { id: 'profile', label: '🏢  Profile' },
    { id: 'operational', label: '⚙️ Logic Controls' },
    { id: 'security', label: '🔒 API Security' }
  ];

  return (
    <div className="w-64 border-r border-slate-100 bg-slate-50/20 p-4 shrink-0 space-y-1.5 flex flex-col text-left font-sans">
      <div className="mb-3 px-1 select-none shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Control Sectors
        </span>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {menuSections.map(item => {
          const isSelected = activeSection === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`group relative w-full px-4 py-3 rounded-xl cursor-pointer transition-colors duration-150 flex items-center ${
                isSelected 
                  ? 'bg-slate-50 text-slate-900 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800 font-semibold'
              }`}
            >
              <span className="text-xs tracking-tight block truncate flex-1">
                {item.label}
              </span>
              
              {/* Signature Token: Left-to-right sliding blue underline highlight micro line */}
              <div className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
