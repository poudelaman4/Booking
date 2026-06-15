import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import ServiceSelect     from './components/ServiceSelect';
import DateTimeStep      from './components/DateTimeStep';
import AvailableStaffStep from './components/AvailableStaffStep';
import BookingSummary    from './components/BookingSummary';
import InputField        from '../../components/ui/InputField';
import TextArea          from '../../components/ui/TextArea';

const todayStr  = () => new Date().toISOString().split('T')[0];

// 🌟 FIXED CURRENCY OVERLAP LOGIC: Removes any hardcoded '$' fallbacks cleanly
const currency  = () => window.igniteSettings?.currency_symbol || '';

const STEPS = [
  { key: 1,   label: 'Services'    },
  { key: 2.1, label: 'Date & Time' },
  { key: 2.2, label: 'Staff'       },
  { key: 3,   label: 'Confirm'     },
];

const STEP_ORDER = STEPS.map(s => s.key);

function StepBar({ step }) {
  const current = STEP_ORDER.indexOf(step);
  return (
    <div className="flex items-start justify-center mb-7 select-none max-w-xl mx-auto w-full">
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border transition-all duration-200
                ${done   ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                : active ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold ring-4 ring-blue-100/50'
                : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${active ? 'text-blue-600' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-3.5 mx-2 min-w-4 transition-colors duration-300 ${done ? 'bg-blue-600' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function PublicBookingForm() {
  const [step, setStep]                         = useState(1);
  const [currentParentId, setCurrentParentId]   = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [categories, setCategories]             = useState([]);
  const [services, setServices]                 = useState([]);
  const [viewMode, setViewMode]                 = useState('categories');
  const [loading, setLoading]                   = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [status, setStatus]                     = useState(null); 
  
  const [wizardData, setWizardData] = useState({
    date:        todayStr(),
    employee_id: '',
    start_time:  '',
    end_time:    '',
    first_name:  '',
    email:       '',
    notes:       '',
  });

  useEffect(() => {
    setLoading(true);
    const route = currentParentId ? `categories?parent_id=${currentParentId}` : 'categories';
    apiClient.request(route)
      .then(async cats => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats); setServices([]); setViewMode('categories');
        } else if (currentParentId) {
          const svcs = await apiClient.request(`services?category_id=${currentParentId}`);
          setServices(Array.isArray(svcs) ? svcs : []); setCategories([]); setViewMode('services');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentParentId]);

  const handleCategoryClick = (id) => {
    setNavigationHistory(prev => [...prev, currentParentId]);
    setCurrentParentId(id);
  };

  const handleBackClick = () => {
    const copy = [...navigationHistory];
    if (viewMode === 'services') {
      setViewMode('categories'); setCurrentParentId(copy.pop()); setNavigationHistory(copy);
    } else if (copy.length > 0) {
      setCurrentParentId(copy.pop()); setNavigationHistory(copy);
    }
  };

  const handleToggleService = (service) => {
    setSelectedServices(prev =>
      prev.some(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]
    );
  };

  const totalPrice    = selectedServices.reduce((s, x) => s + parseFloat(x.price    || 0), 0);
  const totalDuration = selectedServices.reduce((s, x) => s + parseInt(x.duration   || 0), 0);
  const serviceNames  = selectedServices.map(s => s.name).join(', ');

  const handleStaffChosen = (employeeId) => {
    setWizardData(prev => ({
      ...prev,
      employee_id: employeeId,
      start_time:  `${prev.date} ${prev.start_time}:00`,
    }));
    setStep(3);
  };

  const resetForm = () => {
    setSelectedServices([]); setNavigationHistory([]); setCurrentParentId(null);
    setWizardData({ date: todayStr(), employee_id: '', start_time: '', end_time: '', first_name: '', email: '', notes: '' });
    setStatus(null); setStep(1);
  };

  // 🔒 SECURED SERVER-SIDE SUBMIT COMPILING TRACKS
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const customer = await apiClient.request('customers', {
        method: 'POST',
        body: JSON.stringify({ first_name: wizardData.first_name, email: wizardData.email }),
      });

      // 🌟 SECURED: Stripped out client price and end-time variables entirely!
      await apiClient.request('appointments', {
        method: 'POST',
        body: JSON.stringify({
          selected_services: selectedServices, // Sends your e-commerce basket down cleanly
          employee_id:       wizardData.employee_id,
          customer_id:       customer.id,
          start_time:        wizardData.start_time, // Just raw selected start date-time string
          notes:             wizardData.notes,
        }),
      });
      setStatus({ type: 'success', message: "Your appointment is confirmed. We'll see you soon!" });
    } catch (err) {
      setStatus({ type: 'error', message: `Booking failed: ${err.message}` });
    }
  };
  // ── Success screen ──────────────────────────────────────────────
  if (status?.type === 'success') {
    return (
      <div className="w-full max-w-5xl mx-auto my-8 px-4 font-sans text-left animate-fade-in transition-all duration-300 select-none">
        <div className="bg-white border border-slate-100 rounded-2xl p-12 shadow-xs flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-2xl font-black flex items-center justify-center shadow-xs mb-4">✓</div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Booking Confirmed</h2>
          <p className="text-sm text-slate-400 font-semibold max-w-xs mt-1.5 leading-relaxed">{status.message}</p>
          <button
            onClick={resetForm}
            className="group relative mt-6 px-6 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden"
          >
            <span>Book Another Appointment</span>
            <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────
  return (
    /* 🌟 FULL SCREEN MAX-W BREAKOUT INJECTION PASS: Expanded from 'max-w-lg' to full luxury 'max-w-6xl' sizes! */
    <div className="w-full max-w-6xl mx-auto my-8 px-4 sm:px-6 font-sans text-left text-slate-900 animate-fade-in transition-all duration-300 select-none">
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-xs min-h-120 flex flex-col">
        
        <StepBar step={step} />
        
        {status?.type === 'error' && (
          <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-700 max-w-xl mx-auto w-full shadow-2xs">
            {status.message}
          </div>
        )}

        <div className="flex-1 w-full max-w-5xl mx-auto pt-2">
          {step === 1 && (
            <ServiceSelect
              loading={loading}
              viewMode={viewMode}
              categories={categories}
              services={services}
              selectedServices={selectedServices}
              hasHistory={navigationHistory.length > 0 || viewMode === 'services'}
              onCategoryClick={handleCategoryClick}
              onServiceToggle={handleToggleService}
              onBackClick={handleBackClick}
              onProceed={() => setStep(2.1)}
              totalPrice={totalPrice}
              totalDuration={totalDuration}
              currency={currency()} 
            />
          )}

          {step === 2.1 && (
            /* 🌟 FIXED WIZARD ROUTE: Forwards full selected services array to intercept raw duration timelines precisely! */
            <DateTimeStep
              date={wizardData.date}
              startTime={wizardData.start_time}
              totalDuration={totalDuration}
              selectedServices={selectedServices}
              onDateChange={val => setWizardData(prev => ({ ...prev, date: val, start_time: '' }))}
              onTimeSelect={t => setWizardData(prev => ({ ...prev, start_time: t }))}
              onBack={() => setStep(1)}
              onNext={() => setStep(2.2)}
            />
          )}

          {step === 2.2 && (
            /* 🌟 FIXED WIZARD ROUTE: Passes full shopping basket selection directly to trigger strict capability intersection rules! */
            <AvailableStaffStep
              date={wizardData.date}
              startTime={wizardData.start_time}
              totalDuration={totalDuration}
              selectedServices={selectedServices}
              onSelectStaff={handleStaffChosen}
              onBack={() => setStep(2.1)}
            />
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto w-full animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="text-left">
                  <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Your Details</h2>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Almost done — just a few details.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep(2.2)} 
                  className="group relative px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-wider cursor-pointer transition-colors outline-none overflow-hidden"
                >
                  <span>← Back</span>
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
                </button>
              </div>

              <BookingSummary
                servicesList={serviceNames}
                totalPrice={totalPrice}
                totalDuration={totalDuration}
                startTime={wizardData.start_time}
                currency={currency()} 
              />

              <div className="space-y-4 pt-1">
                <InputField label="First Name" placeholder="Jane" value={wizardData.first_name} onChange={e => setWizardData(prev => ({ ...prev, first_name: e.target.value }))} />
                <InputField label="Email Address" type="email" placeholder="jane@example.com" value={wizardData.email} onChange={e => setWizardData(prev => ({ ...prev, email: e.target.value }))} />
                <TextArea label="Notes (optional)" placeholder="Any special requests..." value={wizardData.notes} onChange={e => setWizardData(prev => ({ ...prev, notes: e.target.value }))} />
              </div>

              <button 
                type="submit" 
                className="group relative w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-[11px] font-black text-blue-600 uppercase tracking-wide cursor-pointer transition-colors outline-none overflow-hidden"
              >
                <span>Confirm Booking</span>
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-600 scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
