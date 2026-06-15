import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { apiClient } from './api/client';
import './index.css';
import DashboardView    from './views/Dashboard/DashboardView';
import CalendarView     from './views/Calendar/CalendarView';
import ServicesView     from './views/Services/ServicesView';
import StaffView        from './views/Staff/StaffView';
import CustomersView    from './views/Customers/CustomersView';
import SettingsView     from './views/Settings/SettingsView';
import PublicBookingForm from './views/Public/PublicBookingForm';
import StaffPortalView  from './views/StaffPortal/StaffPortalView';

const viewsMap = {
  // Admin views
  'ignite-root-dashboard':  DashboardView,
  'ignite-root-calendar':   CalendarView,
  'ignite-root-services':   ServicesView,
  'ignite-root-staff':      StaffView,
  'ignite-root-customers':  CustomersView,
  'ignite-root-settings':   SettingsView,
  // Public shortcode
  'ignite-public-booking-connector': PublicBookingForm,
  // Staff portal (non-admin login)
  'ignite-root-staff-portal': StaffPortalView,
};

const bootloaderInitializationMatrix = async () => {
  try {
    const settings = await apiClient.request('settings');
    if (settings && !Array.isArray(settings)) {
      window.igniteSettings = { currency_symbol: settings.currency_symbol || '$' };
    }
  } catch (err) {
    console.error('Bootloader options fallback activated:', err);
    window.igniteSettings = { currency_symbol: '$' };
  }
};

bootloaderInitializationMatrix().finally(() => {
  Object.entries(viewsMap).forEach(([domId, Component]) => {
    const mountElement = document.getElementById(domId);
    if (mountElement) {
      createRoot(mountElement).render(
        <StrictMode>
          <Component />
        </StrictMode>
      );
    }
  });
});