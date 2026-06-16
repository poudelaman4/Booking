<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Repositories\EmployeeRepository;

class EmployeesController extends WP_REST_Controller {
    protected EmployeeRepository $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'employees';
        // 🌟 RE-ANCHORED TRUTH: Initialize your newly expanded repository abstraction handler [INDEX]
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
                'callback' => [$this, 'assign_employee_services'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/reset-password', [
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'regenerate_staff_password'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    /**
     * 🧠 REFACTOR ACCESS: Offloads manual wildcard queries straight to the Repository searchStaff layer [INDEX]
     */
    public function get_items($request): WP_REST_Response {
        $search = sanitize_text_field($request->get_param('search'));
        $results = $this->repo->searchStaff($search);
        return rest_ensure_response($results);
    }

    /**
     * 🧠 REFACTOR ACCESS: Uses the expanded repository to fetch individual row dictionary maps [INDEX]
     */
    public function get_item($request) {
        $id = (int)$request['id'];
        $item = $this->repo->find($id);
        if (!$item) {
            return new WP_Error('not_found', 'Employee not found', ['status' => 404]);
        }
        return rest_ensure_response($item);
    }

    /**
     * 🧠 MANUALLY DEPLOYED ONBOARDING ENGINE: Uses the Admin's customized password string [INDEX]!
     */
    public function create_item($request) {
        $email           = sanitize_email($request->get_param('email'));
        $first_name      = sanitize_text_field($request->get_param('first_name'));
        $last_name       = sanitize_text_field($request->get_param('last_name'));
        $custom_password = $request->get_param('password');

        if (empty($first_name) || empty($email) || !is_email($email)) {
            return new WP_Error('invalid_email', 'A valid name and email are required.', ['status' => 400]);
        }

        if (empty($custom_password) || strlen($custom_password) < 4) {
            return new WP_Error('invalid_password', 'An initial custom password (minimum 4 characters) must be supplied.', ['status' => 400]);
        }

        // 🧠 REFACTOR ACCESS: Replaced manual $wpdb string lookups with clean repository checker layers [INDEX]
        if ($this->repo->checkEmailExists($email)) {
            return new WP_Error('email_exists', 'Email already in use', ['status' => 400]);
        }

        if (email_exists($email) || username_exists($email)) {
            return new WP_Error('user_exists', 'This email address is already bound to an active WordPress user.', ['status' => 400]);
        }

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

        $inserted_id = $this->repo->insert($data);
        if (!$inserted_id) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
            wp_delete_user($wp_user_id);
            return new WP_Error('db_error', 'Could not create employee row entry.', ['status' => 500]);
        }

        $data['id'] = $inserted_id;
        return rest_ensure_response([
            'success' => true,
            'data'    => $data,
            'message' => 'Staff account provisioned successfully with custom credentials.'
        ]);
    }
    public function update_item($request) {
        $id = (int)$request['id'];
        
        // Confirm staff member exists via clear repository checking layers
        if (!$this->repo->find($id)) {
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

        $this->repo->update($id, $data);
        return rest_ensure_response(['success' => true]);
    }

    /**
     * 🧠 REFACTOR ACCESS: Safely detaches system user records using explicit repository definitions [INDEX]
     */
    public function delete_item($request) {
        $id = (int)$request['id'];
        
        // Pull linked user ID directly out of the repository module [INDEX]
        $wp_user_id = $this->repo->getWordPressUserId($id);

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

    /**
     * 🧠 REFACTOR ACCESS: Offloads junction lookup rows entirely to the EmployeeRepository [INDEX]
     */
    public function get_employee_services($request) {
        $employee_id = (int)$request['id'];
        $results = $this->repo->getAssignedServices($employee_id);
        return rest_ensure_response($results);
    }

    /**
     * 🧠 REFACTOR ACCESS: Syncs and flushes assigned treatment mappings cleanly via repository workers [INDEX]
     */
    public function assign_employee_services($request) {
        $employee_id = (int)$request['id'];
        $services = $request->get_param('services');

        if (!is_array($services)) {
            return new WP_Error('invalid_payload', 'Services payload must be an array format.', ['status' => 400]);
        }

        $this->repo->syncAssignedServices($employee_id, $services);
        return rest_ensure_response(['success' => true, 'message' => 'Staff service catalog mapping synced successfully.']);
    }

    /**
     * 🧠 MANUAL ACCOUNT PASSWORD RESET OVERRIDE: Resets account records directly [INDEX]
     */
    public function regenerate_staff_password($request) {
        $id = (int)$request['id'];
        $new_custom_password = $request->get_param('password');

        if (empty($new_custom_password) || strlen($new_custom_password) < 4) {
            return new WP_Error('invalid_password', 'Password must be at least 4 characters.', ['status' => 400]);
        }

        $employee_row = $this->repo->find($id);
        if (!$employee_row) {
            return new WP_Error('not_found', 'Employee not found.', ['status' => 404]);
        }

        $wp_user_id = !empty($employee_row['wp_user_id']) ? (int)$employee_row['wp_user_id'] : null;

        if (!$wp_user_id) {
            $emp_email = $employee_row['email'] ?? '';
            if (empty($emp_email) || !is_email($emp_email)) {
                return new WP_Error('no_email', 'This employee has no email address on file. Add one before setting a password.', ['status' => 400]);
            }

            $existing_user = get_user_by('email', $emp_email);
            if ($existing_user) {
                $wp_user_id = $existing_user->ID;
            } else {
                $wp_user_id = wp_create_user($emp_email, $new_custom_password, $emp_email);
                if (is_wp_error($wp_user_id)) {
                    return new WP_Error('provision_error', 'Could not create WordPress account: ' . $wp_user_id->get_error_message(), ['status' => 500]);
                }
                $user_obj = get_user_by('id', $wp_user_id);
                $user_obj->set_role('subscriber');
                wp_update_user([
                    'ID'         => $wp_user_id,
                    'first_name' => $employee_row['first_name'] ?? '',
                    'last_name'  => $employee_row['last_name'] ?? '',
                ]);
            }

            // Sync the fresh link back down to your employee table records [INDEX]
            $this->repo->update($id, ['wp_user_id' => $wp_user_id]);
        }

        wp_set_password($new_custom_password, $wp_user_id);
        return rest_ensure_response([
            'success' => true,
            'message' => 'Password set. Staff member can now log in.',
        ]);
    }
}
