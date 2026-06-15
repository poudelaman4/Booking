<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;

class StaffPortalController extends WP_REST_Controller {
    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'staff-portal';
    }

    public function register_routes(): void {
        // 🔒 READ STREAM: Sandboxed endpoint allowing logged-in staff to pull ONLY their own appointments
        register_rest_route($this->namespace, '/' . $this->rest_base . '/appointments', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_staff_appointments'],
                'permission_callback' => [RestApi::class, 'checkStaffOrAdminPermission'],
            ],
        ]);

        // 🔒 UPDATE STREAM: Sandboxed status-flipping endpoint explicitly verified against user ownership boundaries
        register_rest_route($this->namespace, '/' . $this->rest_base . '/appointments/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::CREATABLE, // Handles post body payloads natively
                'callback'            => [$this, 'update_staff_appointment_status'],
                'permission_callback' => [RestApi::class, 'checkStaffOrAdminPermission'],
            ],
        ]);
    }

    /**
     * GET /staff-portal/appointments
     * 🧠 SANDBOXED ROSTER ENGINE: Resolves active WordPress user context to query the custom table.
     */
    public function get_staff_appointments($request): WP_REST_Response {
        global $wpdb;
        $appt_table      = $wpdb->prefix . 'ignite_appointments';
        $customers_table = $wpdb->prefix . 'ignite_customers';

        // Resolve active employee_id straight from the logged-in session data
        if (!current_user_can('manage_options')) {
            $employee_id = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}ignite_employees WHERE wp_user_id = %d AND is_active = 1",
                get_current_user_id()
            ));
            if (!$employee_id) {
                return rest_ensure_response([]);
            }
        } else {
            // Master Admin account testing bypass parameter filter string
            $employee_id = (int) $request->get_param('employee_id');
        }

        if (!$employee_id) {
            return rest_ensure_response([]);
        }

        // Run isolated relational database lookups matching only the confirmed employee_id
        $results = $wpdb->get_results($wpdb->prepare("
            SELECT 
                a.*,
                CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone
            FROM $appt_table a
            LEFT JOIN $customers_table c ON a.customer_id = c.id
            WHERE a.employee_id = %d
            ORDER BY a.start_time ASC
        ", $employee_id), ARRAY_A);

        if (empty($results)) {
            return rest_ensure_response([]);
        }

        // Unpack multi-service shopping basket items text headers on the fly from metadata string payloads
        foreach ($results as &$appt) {
            $appt['service_name'] = 'Service Session';
            if (!empty($appt['notes'])) {
                $parsed = json_decode($appt['notes'], true);
                if (!empty($parsed['services']) && is_array($parsed['services'])) {
                    $names = array_map(function($s) { return $s['name']; }, $parsed['services']);
                    $appt['service_name'] = implode(', ', $names);
                }
            }
        }
        unset($appt);

        return rest_ensure_response($results);
    }
    /**
     * POST /staff-portal/appointments/{id}
     * 🧠 SANDBOXED STATUS TRANSACTION WRAPPER: Validates user ownership boundaries on the database level 
     * before committing record mutations [INDEX]!
     */
    public function update_staff_appointment_status($request): WP_REST_Response|WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_appointments';
        $id     = (int) $request['id'];
        $status = sanitize_text_field($request->get_param('status'));

        // Enforce strict layout state bounds checking
        $allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            return new WP_Error('invalid_status', 'Status must be one of: ' . implode(', ', $allowed), ['status' => 400]);
        }

        $appointment = $wpdb->get_row($wpdb->prepare("SELECT id, employee_id FROM $table WHERE id = %d", $id));
        if (!$appointment) {
            return new WP_Error('not_found', 'Appointment record not found.', ['status' => 404]);
        }

        // 🛡️ SECURITY MATCH: Verify non-admin users cannot alter entries belonging to other staff members [INDEX]
        if (!current_user_can('manage_options')) {
            $emp_id = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}ignite_employees WHERE wp_user_id = %d AND is_active = 1",
                get_current_user_id()
            ));
            if (!$emp_id || (int) $appointment->employee_id !== $emp_id) {
                return new WP_Error('forbidden', 'You are restricted to changing states only on your personal appointments.', ['status' => 403]);
            }
        }

        $data = ['status' => $status, 'updated_at' => current_time('mysql')];
        if ($status === 'cancelled') {
            $data['cancelled_at'] = current_time('mysql');
        }

        if ($wpdb->update($table, $data, ['id' => $id]) === false) {
            return new WP_Error('db_error', 'Failed updating booking parameters inside database tables.', ['status' => 500]);
        }

        return rest_ensure_response(['success' => true, 'status' => $status]);
    }
}
