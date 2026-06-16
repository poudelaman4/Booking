<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Repositories\CategoryRepository;

class CategoriesController extends WP_REST_Controller {
    protected CategoryRepository $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'categories';
        // 🌟 RE-ANCHORED TRUTH: Instantiate your newly implemented CategoryRepository module
        $this->repo = new CategoryRepository();
    }

    /**
     * Registers endpoint paths matching the recursive matrix lookup strategy.
     */
    public function register_routes(): void {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_categories'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'save_category'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::EDITABLE, 
                'callback'            => [$this, 'save_category'], 
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
        $parent_param = $request->get_param('parent_id');
        $args = [];

        if ($parent_param !== null && $parent_param !== '') {
            $args['parent_id'] = (int)$parent_param;
        } else {
            $args['parent_id'] = 0; // Standard root parent fallback index [INDEX]
        }

        // 🧠 REFACTOR ACCESS: Offload direct SQL strings to your isolated Repository worker [INDEX]!
        $results = $this->repo->findAll($args);

        return rest_ensure_response($results);
    }

    /**
     * 🧠 UNIFIED MASTER REPOSITORY WORKER: Handles both Creation and Modification paths flawlessly
     */
    public function save_category($request): \WP_REST_Response|\WP_Error {
        $params = $request->get_json_params() ?: $request->get_params();

        // Extract row IDs safely from either the URL path regex string or request body [INDEX]
        $id = null;
        if (!empty($request['id'])) {
            $id = (int)$request['id'];
        } elseif (!empty($params['id'])) {
            $id = (int)$params['id'];
        }

        if (isset($params['name'])) {
            $name = sanitize_text_field($params['name']);
            if (empty($name)) {
                return new WP_Error('missing_field', 'The category title name attribute field cannot be blank.', ['status' => 400]);
            }
        }

        // 🧠 REFACTOR ACCESS: Package fields and stream straight down to our repository handler [INDEX]
        $data_payload = [
            'id'          => $id,
            'name'        => $params['name'] ?? null,
            'parent_id'   => isset($params['parent_id']) ? $params['parent_id'] : null,
            'description' => $params['description'] ?? null,
            'image_url'   => $params['image_url'] ?? null
        ];

        $saved_id = $this->repo->save($data_payload);

        if (!$saved_id) {
            return new WP_Error('db_operation_failed', 'Database layer transaction failure processing category node.', ['status' => 500]);
        }

        // Fetch back the synchronized entry array dictionary [INDEX]
        $synchronized_data = $this->repo->find($saved_id);
        $response = rest_ensure_response($synchronized_data);
        
        if ($id === null) {
            $response->set_status(201); // Created status token on new additions [INDEX]
        }

        return $response;
    }

    /**
     * Public Endpoint: Soft delete implementation flags is_active row column to 0 safely.
     */
    public function delete_category($request): \WP_REST_Response|\WP_Error {
        $id = (int)$request['id'];

        // Execute data purge routines safely via repository rules [INDEX]
        $deleted = $this->repo->delete($id);

        if (!$deleted) {
            return new WP_Error('delete_failed', 'Could not delete category tracking node element.', ['status' => 500]);
        }

        return rest_ensure_response(['deleted' => true, 'id' => $id]);
    }
}
