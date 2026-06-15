<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Repositories\ServiceRepository;

class ServicesController extends WP_REST_Controller {
    protected $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'services';
        $this->repo = new ServiceRepository();
    }

    public function register_routes(): void {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_items'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'create_item'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        // 🌟 FIXED ID RE-ROUTING MATRIX BOUND: Open up EDITABLE to bypass Nginx 404 updates crashes [INDEX]
        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::EDITABLE, // Catch POST/PUT tracking logs [INDEX]
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

    public function get_items($request): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_services';
        
        $category_id = $request->get_param('category_id');

        if (!empty($category_id)) {
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $table WHERE category_id = %d AND is_active = 1 ORDER BY id DESC",
                (int)$category_id
            ));
        } else {
            $results = $wpdb->get_results("SELECT * FROM $table WHERE is_active = 1 ORDER BY id DESC");
        }

        return rest_ensure_response($results);
    }

    public function create_item($request): \WP_REST_Response|\WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_services';

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        if (empty($params['name'])) {
            return new WP_Error('missing_field', 'The service title name attribute field cannot be blank.', ['status' => 400]);
        }

        if (empty($params['category_id'])) {
            return new WP_Error('missing_category', 'Every individual catalog item card must map explicitly to a category ID target leaf folder.', ['status' => 400]);
        }

        $data = [
            'name'         => sanitize_text_field($params['name']),
            'description'  => !empty($params['description']) ? sanitize_textarea_field($params['description']) : null,
            'duration'     => !empty($params['duration']) ? (int)$params['duration'] : 30,
            'price'        => !empty($params['price']) ? (float)$params['price'] : 0.00,
            'category_id'  => (int)$params['category_id'],
            'is_active'    => 1,
            'created_at'   => current_time('mysql')
        ];

        if (isset($params['image_url'])) {
            $data['image_url'] = esc_url_raw($params['image_url']);
        }

        $data['slug'] = sanitize_title($data['name']);
        $inserted = $wpdb->insert($table, $data);

        if (!$inserted) {
            return new WP_Error('db_insert_failed', 'Database layer insertion failure.', ['status' => 500]);
        }

        $data['id'] = $wpdb->insert_id;
        $response = rest_ensure_response($data);
        $response->set_status(201);

        return $response;
    }

    // 🌟 THE DATABASE MODIFIER ENGINE WORKER FOR UPDATING FIELD ROWS [INDEX]
    public function update_item($request): \WP_REST_Response|\WP_Error {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_services';
        $id = (int)$request['id'];

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $data = [
            'updated_at' => current_time('mysql')
        ];

        if (isset($params['name'])) {
            $data['name'] = sanitize_text_field($params['name']);
            $data['slug'] = sanitize_title($data['name']);
        }
        if (isset($params['description'])) {
            $data['description'] = sanitize_textarea_field($params['description']);
        }
        if (isset($params['duration'])) {
            $data['duration'] = (int)$params['duration'];
        }
        if (isset($params['price'])) {
            $data['price'] = (float)$params['price'];
        }
        if (isset($params['image_url'])) {
            $data['image_url'] = esc_url_raw($params['image_url']);
        }

        $updated = $wpdb->update($table, $data, ['id' => $id]);

        if ($updated === false) {
            return new WP_Error('db_update_failed', 'Database layer mutation failure.', ['status' => 500]);
        }

        return rest_ensure_response(['updated' => true, 'id' => $id]);
    }

    public function delete_item($request) {
        $id = (int) $request['id'];
        try {
            $deleted = $this->repo->delete($id);
            if (!$deleted) {
                return new WP_Error('delete_failed', 'Could not delete service. Active bookings exist (RESTRICT).', ['status' => 400]);
            }
            return rest_ensure_response(['deleted' => true]);
        } catch (\Exception $e) {
            return new WP_Error('restrict_block', 'Protected via database constraints.', ['status' => 409]);
        }
    }
}
