<?php
namespace IgniteBookings\Core;

use IgniteBookings\Api\RestApi;

class Plugin {

    /**
     * Initializes core actions, admin navigation hubs, and public shortcodes [INDEX].
     */
    public function init(): void {
        // 🌟 AUTOMATED SYSTEM AUTOLOADER: Pull in Composer mappings securely
        $vendor_autoload = dirname(dirname(__DIR__)) . '/vendor/autoload.php';
        if (file_exists($vendor_autoload)) {
            require_once $vendor_autoload;
        }

        $restApi = new RestApi();
        $restApi->init();

        add_action('admin_menu',             [$this, 'menu']);
        add_action('admin_enqueue_scripts',  [$this, 'assets']);
        add_shortcode('ignite_booking_form', [$this, 'render_public_shortcode']);
        add_action('wp_enqueue_scripts',     [$this, 'public_assets']);
    }

    /**
     * Returns the linked ignite employee row for the current WP user, or null [INDEX].
     */
    private function get_current_employee(): ?object {
        global $wpdb;
        $current_user_id = get_current_user_id();
        if (!$current_user_id) {
            return null;
        }
        return $wpdb->get_row($wpdb->prepare(
            "SELECT id, first_name, last_name FROM {$wpdb->prefix}ignite_employees
             WHERE wp_user_id = %d AND is_active = 1",
            $current_user_id
        ));
    }

    /**
     * Admin menu: full menu for admins, single "My Appointments" item for staff [INDEX].
     */
    public function menu(): void {
        // ── MASTER ADMIN ROLE: Mount complete corporate overview suite panel tracks [INDEX]
        if (current_user_can('manage_options')) {
            add_menu_page(
                'Ignite Bookings', 'Ignite Bookings', 'manage_options',
                'ignite-bookings', [$this, 'render_dashboard'],
                'dashicons-calendar-alt', 30
            );
            add_submenu_page('ignite-bookings', 'Dashboard',     'Dashboard',     'manage_options', 'ignite-bookings', [$this, 'render_dashboard']);
            add_submenu_page('ignite-bookings', 'Calendar',      'Calendar',      'manage_options', 'ignite-booking-calendar', [$this, 'render_calendar']);
            add_submenu_page('ignite-bookings', 'Services',      'Services',      'manage_options', 'ignite-booking-services', [$this, 'render_services']);
            add_submenu_page('ignite-bookings', 'Staff Members', 'Staff',         'manage_options', 'ignite-booking-staff', [$this, 'render_staff']);
            add_submenu_page('ignite-bookings', 'Customers',     'Customers',     'manage_options', 'ignite-booking-customers', [$this, 'render_customers']);
            add_submenu_page('ignite-bookings', 'Settings',      'Settings',      'manage_options', 'ignite-booking-settings', [$this, 'render_settings']);
            return;
        }

        // ── SUBSCRIBER STAFF WORKSTATION: Mount localized dashboard panel tracks ONLY if account links are bound [INDEX]
        $employee = $this->get_current_employee();
        if (!$employee) {
            return;
        }
        
        add_menu_page(
            'Ignite Bookings', 'Ignite Bookings', 'read',
            'ignite-staff-portal', [$this, 'render_staff_portal'],
            'dashicons-calendar-alt', 30
        );
        add_submenu_page(
            'ignite-staff-portal', 'My Appointments', 'My Appointments', 'read',
            'ignite-staff-portal', [$this, 'render_staff_portal']
        );
    }

    // Mount points for the administration views HTML render sockets [INDEX]
    public function render_dashboard(): void { echo '<div class="wrap"><div id="ignite-root-dashboard"></div></div>'; }
    public function render_calendar(): void { echo '<div class="wrap"><div id="ignite-root-calendar"></div></div>'; }
    public function render_services(): void { echo '<div class="wrap"><div id="ignite-root-services"></div></div>'; }
    public function render_staff(): void { echo '<div class="wrap"><div id="ignite-root-staff"></div></div>'; }
    public function render_customers(): void { echo '<div class="wrap"><div id="ignite-root-customers"></div></div>'; }
    public function render_settings(): void { echo '<div class="wrap"><div id="ignite-root-settings"></div></div>'; }
    public function render_staff_portal(): void { echo '<div class="wrap"><div id="ignite-root-staff-portal"></div></div>'; }
    
    public function render_public_shortcode(): string {
        return '<div id="ignite-public-booking-connector"></div>';
    }

    /**
     * Admin asset enqueue — loads for admins AND for staff on their portal page [INDEX].
     */
    public function assets($hook): void {
        $admin_hooks = [
            'toplevel_page_ignite-bookings',
            'ignite-bookings_page_ignite-booking-calendar',
            'ignite-bookings_page_ignite-booking-services',
            'ignite-bookings_page_ignite-booking-staff',
            'ignite-bookings_page_ignite-booking-customers',
            'ignite-bookings_page_ignite-booking-settings',
        ];
        $staff_hook = 'toplevel_page_ignite-staff-portal';

        $is_admin_page = in_array($hook, $admin_hooks, true);
        $is_staff_page = ($hook === $staff_hook);

        if (!$is_admin_page && !$is_staff_page) {
            return;
        }
        wp_enqueue_media(); 
        $base_url  = plugin_dir_url(dirname(__DIR__))  . 'assets/app/';
        $base_path = plugin_dir_path(dirname(__DIR__)) . 'assets/app/';

        // Dynamic filetime cache busting [INDEX]
        $css_ver = file_exists($base_path . 'index.css') ? filemtime($base_path . 'index.css') : '1.0.0';
        $js_ver  = file_exists($base_path . 'index.js')  ? filemtime($base_path . 'index.js')  : '1.0.0';

        wp_enqueue_style('ignite-bookings-styles',  $base_url . 'index.css', [], $css_ver);
        wp_enqueue_script('ignite-bookings-app',    $base_url . 'index.js',  ['jquery', 'wp-api-request', 'underscore'], $js_ver, true);

        // Fetch active logging attributes [INDEX]
        $current_user = wp_get_current_user();
        $user_role    = !empty($current_user->roles) ? reset($current_user->roles) : 'guest';
        $employee     = $this->get_current_employee();

        // 🧠 DEPLOYED SYSTEM SHIELD PASSPORT: Keeps BOTH legacy and modern context objects alive together to kill blank screen crashes [INDEX]!
        wp_localize_script('ignite-bookings-app', 'igniteBookings', [
            'restUrl'     => rest_url('ignite/v1/'),
            'nonce'       => wp_create_nonce('wp_rest'),
            'user_role'   => $user_role,
            'employee_id' => $employee ? (int)$employee->id : null
        ]);

        wp_localize_script('ignite-bookings-app', 'igniteStaffContext', [
            'employee_id'  => $employee ? (int) $employee->id : null,
            'display_name' => $employee
                ? trim($employee->first_name . ' ' . ($employee->last_name ?? ''))
                : $current_user->display_name,
            'is_admin'     => current_user_can('manage_options'),
            'is_staff'     => !current_user_can('manage_options') && !empty($employee),
        ]);
    }

    /**
     * Frontend Public Shortcode Assets Enqueue Layer Pipeline [INDEX]
     */
    public function public_assets(): void {
        global $post;
        if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'ignite_booking_form')) {
            return;
        }

        $base_url  = plugin_dir_url(dirname(__DIR__))  . 'assets/app/';
        $base_path = plugin_dir_path(dirname(__DIR__)) . 'assets/app/';

        $css_ver = file_exists($base_path . 'index.css') ? filemtime($base_path . 'index.css') : '1.0.0';
        $js_ver  = file_exists($base_path . 'index.js')  ? filemtime($base_path . 'index.js')  : '1.0.0';

        wp_enqueue_style('ignite-bookings-styles', $base_url . 'index.css', [], $css_ver);
        wp_enqueue_script('ignite-bookings-app',   $base_url . 'index.js',  ['jquery'], $js_ver, true);

        wp_localize_script('ignite-bookings-app', 'igniteBookings', [
            'restUrl' => rest_url('ignite/v1/'),
            'nonce'   => wp_create_nonce('wp_rest'),
        ]);
    }
}
