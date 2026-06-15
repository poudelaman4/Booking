<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Repositories\PackageRepository;

class PackagesController extends WP_REST_Controller {
    protected $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'packages';
        $this->repo = new PackageRepository();
    }

    public function register_routes(): void {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_items'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => [$this, 'delete_item'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    public function get_items($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_packages';
        return rest_ensure_response($wpdb->get_results("SELECT * FROM $table ORDER BY id DESC"));
    }

    public function delete_item($request) {
        $id = (int) $request['id'];
        if (!$this->repo->delete($id)) {
            return new WP_Error('delete_failed', 'Package was unable to delete safely.', ['status' => 400]);
        }
        return rest_ensure_response(['deleted' => true]);
    }
}
