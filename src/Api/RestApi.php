<?php
namespace IgniteBookings\Api;

use IgniteBookings\Api\Controllers\ServicesController;
use IgniteBookings\Api\Controllers\EmployeesController;
use IgniteBookings\Api\Controllers\AppointmentsController;
use IgniteBookings\Api\Controllers\CustomersController;
use IgniteBookings\Api\Controllers\CategoriesController;
use IgniteBookings\Api\Controllers\WorkingHoursController;
use IgniteBookings\Api\Controllers\SettingsController;
use IgniteBookings\Api\Controllers\StaffPortalController;

class RestApi {

    public const NAMESPACE = 'ignite/v1';

    public function init(): void {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void {
        $controllers = [
            new ServicesController(),
            new EmployeesController(),
            new AppointmentsController(),
            new CustomersController(),
            new CategoriesController(),
            new WorkingHoursController(),
            new SettingsController(),
            new StaffPortalController(), // Instantiates your isolated staff portal endpoints cleanly
        ];

        foreach ($controllers as $controller) {
            if (method_exists($controller, 'register_routes')) {
                $controller->register_routes();
            }
        }
    }

    /**
     * 🔒 GUARD A: Master Admin Verification Check
     * Enforces absolute management permissions for system setting updates [INDEX].
     */
    public static function checkAdminPermission(): bool|\WP_Error {
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to perform this action.', 'ignite-bookings'),
                ['status' => 403]
            );
        }
        return true;
    }

    /**
     * 🔒 GUARD B: Ironclad Staff Portal Verification Check [INDEX]
     * Completely plugs the subscriber loophole. It explicitly runs a live database lookup
     * to verify the user has an active, valid row inside your custom employees table [INDEX]!
     */
    public static function checkStaffOrAdminPermission(): bool|\WP_Error {
        // Let master administrators pass through all checkpoints instantly [INDEX]
        if (current_user_can('manage_options')) {
            return true;
        }

        // Check if the current user session is logged into WordPress at all
        $current_user_id = get_current_user_id();
        if (!$current_user_id) {
            return new \WP_Error(
                'rest_forbidden',
                __('Access Denied: Log-in required to access this endpoint.', 'ignite-bookings'),
                ['status' => 403]
            );
        }

        // 🛡️ THE DATABASE MATCH SHIELD: Look up if this WP user ID matches your hired roster [INDEX]
        global $wpdb;
        $employee_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ignite_employees WHERE wp_user_id = %d AND is_active = 1",
            $current_user_id
        ));

        // If they are a generic WordPress subscriber but NOT in your staff roster, block them instantly [INDEX]!
        if (!$employee_exists) {
            return new \WP_Error(
                'rest_forbidden',
                __('Access Denied: Your account is not linked to an active staff member profile.', 'ignite-bookings'),
                ['status' => 403]
            );
        }

        return true;
    }
}
