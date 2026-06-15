<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;

class SettingsController extends WP_REST_Controller {

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'settings';
    }

    /**
     * Registers get and save configurations mapping global options variables natively.
     */
    public function register_routes(): void {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE, // GET /wp-json/ignite/v1/settings
                'callback'            => [$this, 'get_settings'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE, // POST /wp-json/ignite/v1/settings
                'callback'            => [$this, 'update_settings'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    /**
     * Fetch global configurations out of native wp_options table cache arrays.
     */
    public function get_settings($request): WP_REST_Response {
        // Safe default blueprints fallback dictionary
        $defaults = [
            'business_name'              => 'Ignite Luxury Bookings',
            'business_email'             => get_option('admin_email', 'admin@ignite-bookings.local'),
            'business_phone'             => '',
            'currency_symbol'            => '$',
            'default_appointment_status' => 'pending',
            'global_buffer_before'       => 0,
            'global_buffer_after'        => 0,
            'api_secret_token'           => 'ign_live_sk2026_matrix_token_key'
        ];

        // Fetch our serialized database entry [2]
        $saved = get_option('ignite_bookings_settings', []);
        if (!is_array($saved)) {
            $saved = [];
        }

        // Merge saved parameters cleanly over system fallbacks [2]
        $final_settings = array_merge($defaults, $saved);

        return rest_ensure_response($final_settings);
    }

    /**
     * Write sanitized layout configurations directly into wp_options rows.
     */
    public function update_settings($request): \WP_REST_Response|\WP_Error {
        $params = $request->get_json_params();
        if (empty($params)) {
            $params = $request->get_params();
        }

        // Fetch current values to isolate un-modified parameters safely
        $current = get_option('ignite_bookings_settings', []);
        if (!is_array($current)) {
            $current = [];
        }

        // Sanitize incoming dataset parameters dynamically
        if (isset($params['business_name'])) { $current['business_name'] = sanitize_text_field($params['business_name']); }
        if (isset($params['business_email'])) { $current['business_email'] = sanitize_email($params['business_email']); }
        if (isset($params['business_phone'])) { $current['business_phone'] = sanitize_text_field($params['business_phone']); }
        if (isset($params['currency_symbol'])) { $current['currency_symbol'] = sanitize_text_field($params['currency_symbol']); }
        
        if (isset($params['default_appointment_status'])) { 
            $status = strtolower(sanitize_text_field($params['default_appointment_status']));
            $current['default_appointment_status'] = in_array($status, ['pending', 'confirmed', 'approved']) ? $status : 'pending'; 
        }

        if (isset($params['global_buffer_before'])) { $current['global_buffer_before'] = max(0, (int)$params['global_buffer_before']); }
        if (isset($params['global_buffer_after'])) { $current['global_buffer_after'] = max(0, (int)$params['global_buffer_after']); }
        if (isset($params['api_secret_token'])) { $current['api_secret_token'] = sanitize_text_field($params['api_secret_token']); }

        // Core transactional update execution pass [2]
        $updated = update_option('ignite_bookings_settings', $current);

        return rest_ensure_response([
            'success'  => true,
            'settings' => $current
        ]);
    }
}
