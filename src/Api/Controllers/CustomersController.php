<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Repositories\CustomerRepository;

class CustomersController extends WP_REST_Controller {
    protected CustomerRepository $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'customers';
        // 🌟 RE-ANCHORED TRUTH: Instantiate your newly expanded repository worker layer
        $this->repo = new CustomerRepository();
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
     * 🔮 REFACTORED INGESTION ENDPOINT: Invokes the high-performance 2-pass engine safely from the Repository layer [INDEX]
     */
    public function get_items($request): WP_REST_Response {
        $customers = $this->repo->getCustomersWithAppointments();
        return rest_ensure_response($customers);
    }

    public function create_item($request) {
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
            // 🧠 REFACTOR ACCESS: Call findByEmail helper to prevent duplicate database controller checks [INDEX]
            $existing = $this->repo->findByEmail($email);
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

        // 🧠 REFACTOR ACCESS: Offload insertion arrays safely over the repo layer [INDEX]
        $inserted_id = $this->repo->insert($data);
        if (!$inserted_id) {
            return new WP_Error('db_error', 'Failed to create customer.', ['status' => 500]);
        }

        $data['id']           = $inserted_id;
        $data['appointments'] = [];
        return rest_ensure_response($data);
    }

    public function update_item($request): WP_REST_Response|WP_Error {
        $id = (int)$request['id'];
        $params = $request->get_json_params() ?: $request->get_params();

        $data = ['updated_at' => current_time('mysql')];
        if (isset($params['first_name'])) { $data['first_name'] = sanitize_text_field($params['first_name']); }
        if (isset($params['last_name']))  { $data['last_name']  = sanitize_text_field($params['last_name']); }
        if (isset($params['email']))      { $data['email']      = sanitize_email($params['email']); }
        if (isset($params['phone']))      { $data['phone']      = sanitize_text_field($params['phone']); }

        // 🧠 REFACTOR ACCESS: Stream modifications safely via the repository worker helper [INDEX]
        $updated = $this->repo->update($id, $data);
        if (!$updated) {
            return new WP_Error('db_update_failed', 'Failed to update customer.', ['status' => 500]);
        }

        return rest_ensure_response(['success' => true, 'id' => $id]);
    }

    /**
     * 🔮 CASCADE DELETE ENGINE: Routed completely through clean repository handlers [INDEX]
     */
    public function delete_item($request) {
        $id = (int)$request['id'];

        // 🧠 REFACTOR ACCESS: Cascade wipe appointments and customer passports in one clean step [INDEX]
        $deleted = $this->repo->delete($id);

        if (!$deleted) {
            return new WP_Error('delete_failed', 'Customer not found or database constraints block deletion.', ['status' => 404]);
        }

        return rest_ensure_response(['deleted' => true]);
    }
}
