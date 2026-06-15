<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;

class WorkingHoursController extends WP_REST_Controller {
    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'working-hours';
    }

    public function register_routes(): void {
        register_rest_route($this->namespace, '/' . $this->rest_base . '/employee/(?P<id>[\d]+)', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_employee_hours'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_employee_hours'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/exceptions', [
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'create_availability_exception'],
                'permission_callback' => [RestApi::class, 'checkAdminPermission'],
            ],
        ]);
    }

    /**
     * 🧠 SELF-HEALING Retrievall ENGINE: Protects your settings grid panels from blank table row exceptions!
     * If an employee lacks schedule entries, it maps a pristine 9-to-5 default array matrix in real-time [INDEX].
     */
    public function get_employee_hours($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_working_hours';
        $employee_id = (int) $request['id'];

        // Pull active entries from your database columns
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE employee_id = %d ORDER BY day_of_week ASC", 
            $employee_id
        ), OBJECT);

        // 🌟 FIX UNLOCKED: If the result matrix is empty, return a pristine default 9-to-5 map instantly!
        if (empty($results)) {
            $fallback_schedule = [];
            for ($day = 0; $day <= 6; $day++) {
                $fallback_schedule[] = (object) [
                    'id'          => 0,
                    'employee_id' => $employee_id,
                    'day_of_week' => $day,
                    'start_time'  => '09:00:00', // Default 9 AM
                    'end_time'    => '17:00:00', // Default 5 PM
                    'break_start' => null,
                    'break_end'   => null,
                    'is_day_off'  => ($day === 0) ? 1 : 0 // Set Sunday as default day-off
                ];
            }
            return rest_ensure_response($fallback_schedule);
        }

        return rest_ensure_response($results);
    }
    public function update_employee_hours($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_working_hours';
        $employee_id = (int) $request['id'];
        $schedules = $request->get_param('schedules');

        if (!is_array($schedules)) {
            return new WP_Error('invalid_payload', 'Schedules body format must be an array.', ['status' => 400]);
        }

        foreach ($schedules as $sched) {
            $day_of_week = (int) $sched['day_of_week'];
            $start_time  = sanitize_text_field($sched['start_time']);
            $end_time    = sanitize_text_field($sched['end_time']);
            $is_day_off  = (int) $sched['is_day_off'];

            $break_start = !empty($sched['break_start']) ? sanitize_text_field($sched['break_start']) : null;
            $break_end   = !empty($sched['break_end']) ? sanitize_text_field($sched['break_end']) : null;

            // Enforces atomic schedule state sync directly inside database tables
            $wpdb->query($wpdb->prepare(
                "INSERT INTO $table (employee_id, day_of_week, start_time, end_time, break_start, break_end, is_day_off) 
                 VALUES (%d, %d, %s, %s, %s, %s, %d) 
                 ON DUPLICATE KEY UPDATE start_time = %s, end_time = %s, break_start = %s, break_end = %s, is_day_off = %d",
                $employee_id, $day_of_week, $start_time, $end_time, $break_start, $break_end, $is_day_off,
                $start_time, $end_time, $break_start, $break_end, $is_day_off
            ));
        }

        return rest_ensure_response(['success' => true]);
    }

    /**
     * 🧠 FIXED METHOD: Persists actual day-off or customized hour exceptions into the database.
     */
    public function create_availability_exception($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_employee_availability_exceptions';

        $employee_id    = (int)$request->get_param('employee_id');
        $exception_date = sanitize_text_field($request->get_param('exception_date'));
        $type           = sanitize_text_field($request->get_param('exception_type')); 

        if (!$employee_id || empty($exception_date) || empty($type)) {
            return new WP_Error('missing_data', 'Required fields are missing.', ['status' => 400]);
        }

        $data = [
            'employee_id'    => $employee_id,
            'exception_date' => $exception_date,
            'exception_type' => $type,
            'start_time'     => !empty($request->get_param('start_time')) ? sanitize_text_field($request->get_param('start_time')) : '00:00:00',
            'end_time'       => !empty($request->get_param('end_time')) ? sanitize_text_field($request->get_param('end_time')) : '00:00:00',
            'reason'         => sanitize_text_field($request->get_param('reason'))
        ];

        // Wipe out any existing duplicates for this specific employee date entry before saving fresh parameters
        $wpdb->delete($table, ['employee_id' => $employee_id, 'exception_date' => $exception_date]);

        if (!$wpdb->insert($table, $data)) {
            return new WP_Error('db_error', 'Could not save exception rule.', ['status' => 500]);
        }

        return rest_ensure_response(['success' => true, 'id' => $wpdb->insert_id]);
    }
}
