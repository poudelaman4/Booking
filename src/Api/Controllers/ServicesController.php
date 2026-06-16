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
        // 🌟 RE-ANCHORED TRUTH: Keep repo constructor initialization active
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
     * 🧠 CLEAN REFACTOR: Bypasses duplicate raw SQL commands by mapping queries straight to the Repository pattern [INDEX]
     */
    public function get_items($request): WP_REST_Response {
        $category_id = $request->get_param('category_id');

        // Compile query arguments array structure parameters
        $args = ['is_active' => 1];
        if (!empty($category_id)) {
            $args['category_id'] = (int)$category_id;
        }

        // Pull processed rows array dictionary maps natively from the worker repo layer [INDEX]
        $results = $this->repo->findAll($args);

        return rest_ensure_response($results);
    }

    public function create_item($request): \WP_REST_Response|\WP_Error {
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

        $new_id = $this->repo->create($params);
        if (!$new_id) {
            return new WP_Error('db_insert_failed', 'Database layer insertion failure.', ['status' => 500]);
        }

        $response = rest_ensure_response(array_merge($params, ['id' => $new_id]));
        $response->set_status(201);

        return $response;
    }

    public function update_item($request): \WP_REST_Response|\WP_Error {
        $id = (int)$request['id'];

        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        $updated = $this->repo->update($id, $params);
        if (!$updated) {
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
