<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Repositories\WorkingHoursRepository;

class WorkingHoursController extends WP_REST_Controller {
    protected WorkingHoursRepository $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'working-hours';
        // 🌟 RE-ANCHORED TRUTH: Instantiate your newly expanded repository worker layer
        $this->repo = new WorkingHoursRepository();
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
                'callback'            => [$this, 'update_employee_hours'],
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
     * 🧠 SELF-HEALING RETRIEVAL ENGINE: Protects your settings panels from blank exceptions!
     * Maps a pristine 9-to-5 fallback array matrix natively using repository hooks [INDEX].
     */
    public function get_employee_hours($request) {
        $employee_id = (int)$request['id'];

        // 🧠 REFACTOR ACCESS: Offload direct SQL strings to your isolated Repository worker [INDEX]!
        $results = $this->repo->getHoursByEmployee($employee_id);

        if (empty($results)) {
            $fallback_schedule = [];
            for ($day = 0; $day <= 6; $day++) {
                $fallback_schedule[] = (object) [
                    'id'          => 0,
                    'employee_id' => $employee_id,
                    'day_of_week' => $day,
                    'start_time'  => '09:00:00',
                    'end_time'    => '17:00:00',
                    'break_start' => null,
                    'break_end'   => null,
                    'is_day_off'  => ($day === 0) ? 1 : 0
                ];
            }
            return rest_ensure_response($fallback_schedule);
        }

        return rest_ensure_response($results);
    }

    /**
     * 🧠 REFACTOR ACCESS: Commits bulk schedule updates cleanly via repository atomic syncing [INDEX]
     */
    public function update_employee_hours($request) {
        $employee_id = (int)$request['id'];
        $schedules = $request->get_param('schedules');

        if (!is_array($schedules)) {
            return new WP_Error('invalid_payload', 'Schedules body format must be an array.', ['status' => 400]);
        }

        $this->repo->upsertHours($employee_id, $schedules);

        return rest_ensure_response(['success' => true]);
    }

    /**
     * 🧠 AUDIT REFACTOR FIXED METHOD: Safely persists exceptions into the table registry [INDEX].
     */
    public function create_availability_exception($request) {
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

        // 🧠 REFACTOR ACCESS: Clear past date duplicates via safe repository helper layers [INDEX]
        $this->repo->clearDuplicateException($employee_id, $exception_date);

        // 🌟 AUDIT CORRECTION FIXED: Inserts data straight through the verified database maps to prevent background slot crashes [INDEX]
        $inserted_id = $this->repo->insertException($data);

        if (!$inserted_id) {
            return new WP_Error('db_error', 'Could not save exception rule.', ['status' => 500]);
        }

        return rest_ensure_response(['success' => true, 'id' => $inserted_id]);
    }
}
