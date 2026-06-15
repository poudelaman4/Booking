<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;

class CategoriesController extends WP_REST_Controller {

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'categories';
    }

    /**
     * Registers endpoint paths matching the recursive matrix lookup strategy.
     */
    public function register_routes(): void {
        // Base collections route container
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_categories'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE, // POST creation requests
                'callback'            => [$this, 'save_category'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        // Route matching individual row IDs explicitly
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::EDITABLE, // POST updates on /categories/<id> [INDEX]
                'callback'            => [$this, 'save_category'], // Unified: Route straight to our master save worker!
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'delete_category'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    /**
     * Public Endpoint: Returns active categories based on an optional parent_id parameter filter.
     */
    public function get_categories($request): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_service_categories';
        
        $parent_param = $request->get_param('parent_id');

        if ($parent_param === null || $parent_param === '') {
            $query = "SELECT * FROM $table WHERE parent_id IS NULL AND is_active = 1 ORDER BY id ASC";
            $results = $wpdb->get_results($query);
        } else {
            $parent_id = (int)$parent_param;
            $query = $wpdb->prepare(
                "SELECT * FROM $table WHERE parent_id = %d AND is_active = 1 ORDER BY id ASC",
                $parent_id
            );
            $results = $wpdb->get_results($query);
        }

        return rest_ensure_response($results);
    }

    /**
     * 🧠 UNIFIED MASTER REPOSITORY WORKER: Handles both Creation and Modification paths flawlessly
     */
    public function save_category($request): \WP_REST_Response|\WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_service_categories';

        // Suppress raw WordPress HTML tracking logs error page outputs permanently!
        $wpdb->hide_errors();

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        // 🧠 FIXED PARAMETER RESOLVER: Extract row IDs safely from either the URL path regex string or request body [INDEX]
        $id = null;
        if (!empty($request['id'])) {
            $id = (int)$request['id'];
        } elseif (!empty($params['id'])) {
            $id = (int)$params['id'];
        }

        $is_edit_mode = ($id !== null && $id > 0);

        // Build our SQL payload update array data context
        $data = [];

        if (isset($params['name'])) {
            $name = sanitize_text_field($params['name']);
            if (empty($name)) {
                return new WP_Error('missing_field', 'The category title name attribute field cannot be blank.', ['status' => 400]);
            }
            $data['name'] = $name;

            // 🛡️ ACCENT SLUG GUARD LAYER: Only process unique slug calculations on new creations to protect database stability!
            if (!$is_edit_mode) {
                $base_slug = sanitize_title($name);
                if (empty($base_slug)) { $base_slug = 'category-node'; }
                $slug = $base_slug;
                $counter = 1;
                while (true) {
                    $check_query = $wpdb->prepare("SELECT id FROM $table WHERE slug = %s", $slug);
                    $existing_id = $wpdb->get_var($check_query);
                    if (empty($existing_id)) { break; }
                    $slug = $base_slug . '-' . $counter;
                    $counter++;
                }
                $data['slug'] = $slug;
            }
        }

        if (isset($params['description'])) {
            $data['description'] = !empty($params['description']) ? sanitize_textarea_field($params['description']) : null;
        }

        if (isset($params['image_url'])) {
            $data['image_url'] = !empty($params['image_url']) ? esc_url_raw($params['image_url']) : null;
        }

        // Parent ID Normalization
        if (isset($params['parent_id'])) {
            if ($params['parent_id'] !== '' && $params['parent_id'] !== null && (int)$params['parent_id'] !== 0) {
                $data['parent_id'] = (int)$params['parent_id'];
            } else {
                $data['parent_id'] = null;
            }
        }

        if ($is_edit_mode) {
            // 🔄 EXPLICIT UPDATE DISPATCH: Commit mutations into existing indexes smoothly [INDEX]
            $data['updated_at'] = current_time('mysql');
            $updated = $wpdb->update($table, $data, ['id' => $id]);
            
            if ($updated === false) {
                $db_err = $wpdb->last_error ? $wpdb->last_error : 'Data constraint error matching column types.';
                return new WP_Error('db_update_failed', 'Database mutation error: ' . $db_err, ['status' => 500]);
            }
            
            $data['id'] = $id;
            return rest_ensure_response($data);
        } else {
            // ➕ EXPLICIT INSERT DISPATCH: Commit fresh rows into the database [INDEX]
            $data['is_active'] = 1;
            $data['created_at'] = current_time('mysql');
            
            // If parent_id isn't defined on a root creation path, lock it to null explicitly
            if (!isset($data['parent_id'])) {
                $data['parent_id'] = null;
            }

            $inserted = $wpdb->insert($table, $data);
            if (!$inserted) {
                $db_err = $wpdb->last_error ? $wpdb->last_error : 'Schema validation error.';
                return new WP_Error('db_insert_failed', 'Database insertion error: ' . $db_err, ['status' => 500]);
            }
            
            $data['id'] = $wpdb->insert_id;
            $response = rest_ensure_response($data);
            $response->set_status(201);
            return $response;
        }
    }

    /**
     * Public Endpoint: Soft delete implementation flags is_active row column to 0 safely.
     */
    public function delete_category($request): \WP_REST_Response|\WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_service_categories';
        $id = (int)$request['id'];

        $deleted = $wpdb->update($table, ['is_active' => 0, 'updated_at' => current_time('mysql')], ['id' => $id]);

        if ($deleted === false) {
            return new WP_Error('delete_failed', 'Could not delete category tracking node element.', ['status' => 500]);
        }

        return rest_ensure_response(['deleted' => true, 'id' => $id]);
    }
}
