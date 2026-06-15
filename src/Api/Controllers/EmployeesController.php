<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Repositories\EmployeeRepository;

class EmployeesController extends WP_REST_Controller {
    protected $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'employees';
        $this->repo = new EmployeeRepository();
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
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_item'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
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

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/services', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_employee_services'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'assign_employee_services'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        // 🌟 ROUTE INJECTION RESET PASSPORT: Endpoint to change/reset passwords via Admin custom choice
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/reset-password', [
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'regenerate_staff_password'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    public function get_items($request): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_employees';
        $search = sanitize_text_field($request->get_param('search'));

        if (!empty($search)) {
            $wildcard = '%' . $wpdb->esc_like($search) . '%';
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $table WHERE first_name LIKE %s OR last_name LIKE %s ORDER BY id DESC",
                $wildcard, $wildcard
            ));
        } else {
            $results = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");
        }

        return rest_ensure_response($results);
    }

    public function get_item($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_employees';
        $id = (int) $request['id'];
        
        $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
        if (!$item) {
            return new WP_Error('not_found', 'Employee not found', ['status' => 404]);
        }
        return rest_ensure_response($item);
    }

    /**
     * 🧠 MANUALLY DEPLOYED ONBOARDING ENGINE: Uses the Admin's customized password string!
     */
    public function create_item($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_employees';
        $email = sanitize_email($request->get_param('email'));
        $first_name = sanitize_text_field($request->get_param('first_name'));
        $last_name  = sanitize_text_field($request->get_param('last_name'));
        
        // 🌟 NEW FIELD: Capture the password typed manually by the Admin in the form [INDEX]
        $custom_password = $request->get_param('password');

        if (empty($first_name) || empty($email) || !is_email($email)) {
            return new WP_Error('invalid_email', 'A valid name and email are required.', ['status' => 400]);
        }

        if (empty($custom_password) || strlen($custom_password) < 4) {
            return new WP_Error('invalid_password', 'An initial custom password (minimum 4 characters) must be supplied.', ['status' => 400]);
        }

        if ($wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE email = %s", $email))) {
            return new WP_Error('email_exists', 'Email already in use', ['status' => 400]);
        }

        if (email_exists($email) || username_exists($email)) {
            return new WP_Error('user_exists', 'This email address is already bound to an active WordPress user.', ['status' => 400]);
        }

        // 🌟 USER CONTRACT: Provision account using the admin's chosen password phrase instead of random text! [INDEX]
        $wp_user_id = wp_create_user($email, $custom_password, $email);
        if (is_wp_error($wp_user_id)) {
            return new WP_Error('provision_error', 'WordPress user account creation failed: ' . $wp_user_id->get_error_message(), ['status' => 500]);
        }

        $user_object = get_user_by('id', $wp_user_id);
        $user_object->set_role('subscriber');
        
        wp_update_user([
            'ID'         => $wp_user_id,
            'first_name' => $first_name,
            'last_name'  => $last_name
        ]);

        $data = [
            'wp_user_id' => $wp_user_id,
            'first_name' => $first_name,
            'last_name'  => $last_name,
            'email'      => $email,
            'phone'      => sanitize_text_field($request->get_param('phone')),
            'avatar_url' => sanitize_url($request->get_param('avatar_url')), 
            'bio'        => sanitize_textarea_field($request->get_param('bio')),
            'is_active'  => $request->get_param('is_active') !== null ? (int)$request->get_param('is_active') : 1,
        ];

        if (!$wpdb->insert($table, $data)) {
            wp_delete_user($wp_user_id);
            return new WP_Error('db_error', 'Could not create employee row entry.', ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        
        return rest_ensure_response([
            'success' => true,
            'data'    => $data,
            'message' => 'Staff account provisioned successfully with custom credentials.'
        ]);
    }

    public function update_item($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_employees';
        $id = (int) $request['id'];

        if (!$wpdb->get_row($wpdb->prepare("SELECT id FROM $table WHERE id = %d", $id))) {
            return new WP_Error('not_found', 'Employee not found', ['status' => 404]);
        }

        $data = [];
        foreach (['wp_user_id', 'first_name', 'last_name', 'email', 'phone', 'avatar_url', 'bio', 'is_active'] as $param) {
            if ($request->get_param($param) !== null) {
                if ($param === 'bio') {
                    $data[$param] = sanitize_textarea_field($request->get_param($param));
                } elseif ($param === 'avatar_url') {
                    $data[$param] = sanitize_url($request->get_param($param));
                } else {
                    $data[$param] = sanitize_text_field($request->get_param($param));
                }
            }
        }
        $data['updated_at'] = current_time('mysql');

        $wpdb->update($table, $data, ['id' => $id]);
        return rest_ensure_response(['success' => true]);
    }
    public function delete_item($request) {
        $id = (int) $request['id'];
        global $wpdb;

        $wp_user_id = $wpdb->get_var($wpdb->prepare(
            "SELECT wp_user_id FROM {$wpdb->prefix}ignite_employees WHERE id = %d", 
            $id
        ));

        try {
            if (!$this->repo->delete($id)) {
                return new WP_Error('delete_failed', 'Employee has references in active appointments (RESTRICT).', ['status' => 400]);
            }

            if ($wp_user_id) {
                require_once ABSPATH . 'wp-admin/includes/user.php';
                wp_delete_user($wp_user_id);
            }

            return rest_ensure_response(['deleted' => true]);
        } catch (\Exception $e) {
            return new WP_Error('restrict_block', 'Protected via database schema constraints.', ['status' => 409]);
        }
    }

    public function get_employee_services($request) {
        global $wpdb;
        $pivot_table = $wpdb->prefix . 'ignite_employee_services';
        $services_table = $wpdb->prefix . 'ignite_services';
        $employee_id = (int) $request['id'];

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT s.*, es.custom_price, es.is_active as assignment_active 
             FROM $services_table s 
             INNER JOIN $pivot_table es ON s.id = es.service_id 
             WHERE es.employee_id = %d",
            $employee_id
        ));

        return rest_ensure_response($results);
    }

    public function assign_employee_services($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_employee_services';
        $employee_id = (int) $request['id'];
        $services = $request->get_param('services');

        if (!is_array($services)) {
            return new WP_Error('invalid_payload', 'Services payload must be an array format.', ['status' => 400]);
        }

        $wpdb->delete($table, ['employee_id' => $employee_id], ['%d']);

        foreach ($services as $service) {
            $service_id = (int) $service['service_id'];
            $custom_price = isset($service['custom_price']) ? (float)$service['custom_price'] : null;

            $wpdb->insert($table, [
                'employee_id'  => $employee_id,
                'service_id'   => $service_id,
                'custom_price' => $custom_price,
                'is_active'    => 1
            ]);
        }

        return rest_ensure_response(['success' => true, 'message' => 'Staff service catalog mapping synced successfully.']);
    }

    /**
     * 🧠 MANUAL ACCOUNT PASSWORD RESET OVERRIDE: Resets account records directly.
     * Overwrites user password entries using the Admin's explicitly typed custom choice [INDEX]!
     */
 public function regenerate_staff_password($request) {
    $id = (int)$request['id'];
    global $wpdb;

    $new_custom_password = $request->get_param('password');

    if (empty($new_custom_password) || strlen($new_custom_password) < 4) {
        return new WP_Error('invalid_password', 'Password must be at least 4 characters.', ['status' => 400]);
    }

    $employee = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}ignite_employees WHERE id = %d",
        $id
    ));

    if (!$employee) {
        return new WP_Error('not_found', 'Employee not found.', ['status' => 404]);
    }

    $wp_user_id = $employee->wp_user_id;

    // ── Employee has no WP account yet (added before this feature existed) ──
    if (!$wp_user_id) {
        if (empty($employee->email) || !is_email($employee->email)) {
            return new WP_Error('no_email', 'This employee has no email address on file. Add one before setting a password.', ['status' => 400]);
        }

        // Re-use existing WP user if the email is already registered
        $existing_user = get_user_by('email', $employee->email);

        if ($existing_user) {
            $wp_user_id = $existing_user->ID;
        } else {
            // Create a fresh WP account
            $wp_user_id = wp_create_user($employee->email, $new_custom_password, $employee->email);
            if (is_wp_error($wp_user_id)) {
                return new WP_Error('provision_error', 'Could not create WordPress account: ' . $wp_user_id->get_error_message(), ['status' => 500]);
            }
            $user_obj = get_user_by('id', $wp_user_id);
            $user_obj->set_role('subscriber');
            wp_update_user([
                'ID'         => $wp_user_id,
                'first_name' => $employee->first_name,
                'last_name'  => $employee->last_name,
            ]);
        }

        // Link the WP user back to the employee row
        $wpdb->update(
            $wpdb->prefix . 'ignite_employees',
            ['wp_user_id' => $wp_user_id],
            ['id' => $id],
            ['%d'],
            ['%d']
        );
    }

    // Now set (or reset) the password
    wp_set_password($new_custom_password, $wp_user_id);

    return rest_ensure_response([
        'success' => true,
        'message' => 'Password set. Staff member can now log in.',
    ]);
}
}
