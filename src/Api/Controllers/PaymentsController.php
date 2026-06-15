<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;

class PaymentsController extends WP_REST_Controller {
    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'payments';
    }

    public function register_routes(): void {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'log_transaction'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    public function log_transaction($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_payments';
        $txn_id = sanitize_text_field($request->get_param('transaction_id'));

        if (!empty($txn_id) && $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE transaction_id = %s", $txn_id))) {
            return new WP_Error('duplicate_txn', 'This Transaction ID has already been logged.', ['status' => 400]);
        }

        $data = [
            'appointment_id' => (int) $request->get_param('appointment_id'),
            'transaction_id' => $txn_id ?: null,
            'gateway'        => sanitize_text_field($request->get_param('gateway')),
            'amount'         => (float) $request->get_param('amount'),
            'status'         => sanitize_text_field($request->get_param('status') ?: 'pending'),
        ];

        if (!$wpdb->insert($table, $data)) {
            return new WP_Error('failed_log', 'Could not record transaction entry.', ['status' => 500]);
        }

        return rest_ensure_response(['logged' => true, 'id' => $wpdb->insert_id]);
    }
}
