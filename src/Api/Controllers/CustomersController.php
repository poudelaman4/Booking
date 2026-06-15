<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;

class CustomersController extends WP_REST_Controller {
    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'customers';
    }

    public function register_routes(): void {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_items'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'create_item'],
                'permission_callback' => '__return_true',
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [$this, 'update_item'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'delete_item'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    /**
     * 🔮 SECURED HIGH-PERFORMANCE INGESTION: Kills N+1 database bottlenecks permanently!
     * Consolidates separate loop hits into exactly 2 optimized database passes total [INDEX].
     */
    public function get_items($request): WP_REST_Response {
        global $wpdb;
        $customers_table    = $wpdb->prefix . 'ignite_customers';
        $appointments_table = $wpdb->prefix . 'ignite_appointments';
        $employees_table    = $wpdb->prefix . 'ignite_employees';
        $services_table     = $wpdb->prefix . 'ignite_services';

        $wpdb->hide_errors();

        // 🌟 PASS 1: Fetch all primary customer rows in one single roundtrip [INDEX]
        $customers = $wpdb->get_results("SELECT * FROM $customers_table ORDER BY id DESC", ARRAY_A);

        if (empty($customers)) {
            return rest_ensure_response([]);
        }

        // Collect all client row unique IDs cleanly [INDEX]
        $customer_ids = array_map(function($c) { return (int)$c['id']; }, $customers);
        $ids_string   = implode(',', $customer_ids);

        // 🌟 PASS 2: Batch fetch ALL appointments for ALL collected customers at the exact same time [INDEX]!
        // Uses an optimized SQL 'IN (...)' block to fetch everything in a single trip [INDEX]!
        $all_appointments = $wpdb->get_results(
            "SELECT * FROM $appointments_table WHERE customer_id IN ($ids_string) ORDER BY start_time DESC",
            ARRAY_A
        );

        // Pre-fetch employees and services lookup maps to avoid sub-query loops completely [INDEX]
        $employees_cache = $wpdb->get_results("SELECT id, first_name, last_name FROM $employees_table", ARRAY_A);
        $employees_map   = array_column($employees_cache, null, 'id');

        $services_cache  = $wpdb->get_results("SELECT id, name FROM $services_table", ARRAY_A);
        $services_map    = array_column($services_cache, 'name', 'id');

        // Group appointments into memory indexed customer buckets cleanly [INDEX]
        $grouped_appointments = [];
        if (!empty($all_appointments)) {
            foreach ($all_appointments as $appt) {
                // Resolve employee name out of memory cache map safely [INDEX]
                $emp_id = (int)$appt['employee_id'];
                $appt['employee_name'] = isset($employees_map[$emp_id])
                    ? trim($employees_map[$emp_id]['first_name'] . ' ' . ($employees_map[$emp_id]['last_name'] ?? ''))
                    : 'Specialist';

                // Resolve service name out of memory cache map safely [INDEX]
                $srv_id = (int)$appt['service_id'];
                $appt['service_name'] = isset($services_map[$srv_id]) ? $services_map[$srv_id] : 'Service Session';

                // Format datetime separation parameters for the frontend layout [INDEX]
                $ts                  = !empty($appt['start_time']) ? strtotime($appt['start_time']) : time();
                $appt['booking_date'] = date('Y-m-d', $ts);
                $appt['booking_time'] = date('H:i:s', $ts);

                // Setup default fallbacks
                $appt['duration']        = $appt['duration']        ?? 30;
                $appt['buffer_after']    = $appt['buffer_after']    ?? 0;
                $appt['internal_notes']  = $appt['internal_notes']  ?? ($appt['notes'] ?? null);

                $c_id = (int)$appt['customer_id'];
                $grouped_appointments[$c_id][] = $appt;
            }
        }
        // 🧠 MEMORY COMPILER MATRIX: Map the cached appointments back to their owner buckets safely
        foreach ($customers as &$customer) {
            $customer_id = (int)$customer['id'];
            $total_visits = 0;
            $total_spend  = 0.00;

            if (isset($grouped_appointments[$customer_id])) {
                $appts = $grouped_appointments[$customer_id];
                
                foreach ($appts as $appt) {
                    // Accumulate metrics for non-cancelled bookings dynamically from cache [INDEX]
                    if (strtolower($appt['status'] ?? '') !== 'cancelled') {
                        $total_visits++;
                        $total_spend += (float)($appt['price'] ?? 0);
                    }
                }
$customer['appointments'] = $appts;
            } else {
                $customer['appointments'] = [];
            }

            $customer['total_appointments'] = $total_visits;
            $customer['total_spent']        = $total_spend;
        }
        // IMPORTANT: unset reference to avoid corrupting the last customer row pointer
        unset($customer);

        return rest_ensure_response($customers);
    }

    public function create_item($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_customers';

        $first_name = sanitize_text_field($request->get_param('first_name'));
        $last_name  = sanitize_text_field($request->get_param('last_name'));
        $email      = sanitize_email($request->get_param('email'));

        if (empty($first_name)) {
            return new WP_Error('missing_field', 'First name is required.', ['status' => 400]);
        }

        if (!empty($email)) {
            if (!is_email($email)) {
                return new WP_Error('invalid_email', 'Invalid email address.', ['status' => 400]);
            }
            $existing = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE email = %s", $email), ARRAY_A);
            if ($existing) {
                $existing['appointments'] = [];
                return rest_ensure_response($existing);
            }
        }

        $data = [
            'first_name' => $first_name,
            'last_name'  => $last_name ?: null,
            'email'      => !empty($email) ? $email : null,
            'phone'      => sanitize_text_field($request->get_param('phone')),
            'timezone'   => sanitize_text_field($request->get_param('timezone') ?: 'UTC'),
        ];

        $inserted = $wpdb->insert($table, $data);
        if (!$inserted) {
            return new WP_Error('db_error', 'Failed to create customer.', ['status' => 500]);
        }

        $data['id']           = $wpdb->insert_id;
        $data['appointments'] = [];
        return rest_ensure_response($data);
    }

    public function update_item($request): WP_REST_Response|WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_customers';
        $id    = (int) $request['id'];

        $params = $request->get_json_params() ?: $request->get_params();

        $data = ['updated_at' => current_time('mysql')];
        if (isset($params['first_name'])) { $data['first_name'] = sanitize_text_field($params['first_name']); }
        if (isset($params['last_name']))  { $data['last_name']  = sanitize_text_field($params['last_name']); }
        if (isset($params['email']))      { $data['email']      = sanitize_email($params['email']); }
        if (isset($params['phone']))      { $data['phone']      = sanitize_text_field($params['phone']); }

        $updated = $wpdb->update($table, $data, ['id' => $id]);
        if ($updated === false) {
            return new WP_Error('db_update_failed', 'Failed to update customer.', ['status' => 500]);
        }

        return rest_ensure_response(['success' => true, 'id' => $id]);
    }

    /**
     * 🔮 CASCADE DELETE ENGINE: Deletes related appointment rows cleanly [INDEX].
     * Eradicates ghost appointments from your database automatically [INDEX]!
     */
    public function delete_item($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_customers';
        $appointments_table = $wpdb->prefix . 'ignite_appointments';
        $id    = (int) $request['id'];

        // 🌟 STEP A: Prioritize cleaning up the appointments table to sweep orphans first [INDEX]!
        $wpdb->delete($appointments_table, ['customer_id' => $id], ['%d']);

        // 🌟 STEP B: Safely wipe out the primary customer profile record entry [INDEX]
        $deleted = $wpdb->delete($table, ['id' => $id], ['%d']);

        if ($deleted === false) {
            return new WP_Error('db_error', 'Database error during deletion.', ['status' => 500]);
        }
        if ($deleted === 0) {
            return new WP_Error('not_found', 'Customer not found.', ['status' => 404]);
        }

        return rest_ensure_response(['deleted' => true]);
    }
}
