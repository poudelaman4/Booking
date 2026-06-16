<?php
namespace IgniteBookings\Api\Controllers;

use WP_REST_Controller;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;
use IgniteBookings\Api\RestApi;
use IgniteBookings\Utils\SlotGenerator;
use IgniteBookings\Repositories\AppointmentRepository;

class AppointmentsController extends WP_REST_Controller {
    protected AppointmentRepository $repo;

    public function __construct() {
        $this->namespace = RestApi::NAMESPACE;
        $this->rest_base = 'appointments';
        // 🌟 RE-ANCHORED TRUTH: Initialize your newly expanded repository abstraction handler [INDEX]
        $this->repo = new AppointmentRepository();
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
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/slots', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_available_time_slots'],
                'permission_callback' => '__return_true',
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/available-staff', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_available_staff'],
                'permission_callback' => '__return_true',
            ],
        ]);

        register_rest_route($this->namespace, '/' . $this->rest_base . '/capable-staff', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_capable_staff_count'],
                'permission_callback' => '__return_true',
            ],
        ]);
    }

    /**
     * 🧠 CLEAN REFACTOR: Offloads manual LEFT JOIN raw SQL selections straight to the Repository layer [INDEX]
     */
    public function get_items($request): WP_REST_Response {
        $results = $this->repo->getAppointmentsWithMeta();

        if (empty($results)) {
            return rest_ensure_response([]);
        }

        foreach ($results as &$appt) {
            $appt['service_name'] = 'Service Session';
            if (!empty($appt['notes'])) {
                $parsed = json_decode($appt['notes'], true);
                if (!empty($parsed['services']) && is_array($parsed['services'])) {
                    $names = array_map(function($s) { return $s['name']; }, $parsed['services']);
                    $appt['service_name'] = implode(', ', $names);
                }
            }
        }
        unset($appt);

        return rest_ensure_response($results);
    }

    public function create_item($request) {
        global $wpdb;
        $appointments_table = $wpdb->prefix . 'ignite_appointments';
        $services_table     = $wpdb->prefix . 'ignite_services';

        $status = sanitize_text_field($request->get_param('status') ?: 'pending');
        if (!in_array($status, ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], true)) {
            return new WP_Error('invalid_status', 'Invalid status value.', ['status' => 400]);
        }

        $employee_id = (int)$request->get_param('employee_id');
        $customer_id = (int)$request->get_param('customer_id');
        $start_time  = sanitize_text_field($request->get_param('start_time'));

        // 🧠 CLEAN REFACTOR: Replaced manual $wpdb lookup selectors with repository data abstraction indicators [INDEX]
        if (!$this->repo->verifyCustomerExists($customer_id)) {
            return new WP_Error('invalid_customer', 'Customer not found.', ['status' => 400]);
        }
        if (!$this->repo->verifyStaffExists($employee_id)) {
            return new WP_Error('invalid_employee', 'Staff member not found.', ['status' => 400]);
        }

        $raw_services = $request->get_param('selected_services');
        $services_basket = is_array($raw_services) ? $raw_services : [];

        if (empty($services_basket)) {
            $incoming_srv_id = (int)$request->get_param('service_id');
            if ($incoming_srv_id > 0) {
                $fallback_row = $wpdb->get_row(
                    $wpdb->prepare("SELECT id, name, price, duration FROM $services_table WHERE id = %d", $incoming_srv_id),
                    ARRAY_A
                );
                if ($fallback_row) $services_basket[] = $fallback_row;
            }
        }

        if (empty($services_basket)) {
            return new WP_Error('missing_services', 'At least one service is required.', ['status' => 400]);
        }

        $verified_services_list = [];
        $calculated_total_price = 0.00;
        $calculated_total_duration = 0;

        foreach ($services_basket as $incoming_srv) {
            $srv_id = (int)$incoming_srv['id'];
            $db_row = $wpdb->get_row(
                $wpdb->prepare("SELECT id, name, price, duration FROM $services_table WHERE id = %d", $srv_id),
                ARRAY_A
            );
            if (!$db_row) {
                return new WP_Error('invalid_service', "Service ID #{$srv_id} not found.", ['status' => 400]);
            }

            $verified_services_list[] = [
                'id'       => (int)$db_row['id'],
                'name'     => sanitize_text_field($db_row['name']),
                'price'    => (float)$db_row['price'],
                'duration' => (int)$db_row['duration'],
            ];
            $calculated_total_price    += (float)$db_row['price'];
            $calculated_total_duration += (int)$db_row['duration'];
        }

        if (empty($start_time) || strtotime($start_time) === false) {
            return new WP_Error('invalid_datetime', 'A valid start time is required (Y-m-d H:i:s).', ['status' => 400]);
        }

        $start_timestamp = strtotime($start_time);
        if ($start_timestamp < current_time('timestamp')) {
            return new WP_Error('past_time', 'Cannot book appointments in the past.', ['status' => 400]);
        }

        $end_timestamp = $start_timestamp + ($calculated_total_duration * 60);
        $server_computed_end = date('Y-m-d H:i:s', $end_timestamp);

        $meta_payload = [
            'user_notes' => sanitize_textarea_field($request->get_param('notes')),
            'services'   => $verified_services_list,
        ];

        $primary_service_id = !empty($verified_services_list) ? $verified_services_list[0]['id'] : 0;

        $data = [
            'service_id'   => $primary_service_id,
            'employee_id'  => $employee_id,
            'customer_id'  => $customer_id,
            'package_id'   => $request->get_param('package_id') ? (int)$request->get_param('package_id') : null,
            'start_time'   => date('Y-m-d H:i:s', $start_timestamp),
            'end_time'     => $server_computed_end,
            'status'       => $status,
            'price'        => $calculated_total_price,
            'paid_amount'  => 0.00,
            'notes'        => json_encode($meta_payload),
        ];

        if (!$wpdb->insert($appointments_table, $data)) {
            return new WP_Error('db_error', 'Failed to create appointment.', ['status' => 500]);
        }

        return rest_ensure_response(['id' => $wpdb->insert_id, 'status' => 'success']);
    }
    public function update_item($request) {
        global $wpdb;
        $table = $wpdb->prefix . 'ignite_appointments';
        $id = (int)$request['id'];
        $status = sanitize_text_field($request->get_param('status'));
        $data = [];

        if ($status) {
            if (!in_array($status, ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], true)) {
                return new WP_Error('invalid_status', 'Invalid status value.', ['status' => 400]);
            }
            $data['status'] = $status;
            if ($status === 'cancelled') {
                $data['cancelled_at'] = current_time('mysql');
                $data['cancellation_reason'] = sanitize_text_field($request->get_param('cancellation_reason'));
            }
        }

        if ($request->get_param('notes') !== null) {
            $data['notes'] = sanitize_textarea_field($request->get_param('notes'));
        }
        $data['updated_at'] = current_time('mysql');

        $wpdb->update($table, $data, ['id' => $id]);
        return rest_ensure_response(['success' => true]);
    }

    public function get_available_time_slots($request) {
        $employee_id = (int)$request->get_param('employee_id');
        $date = sanitize_text_field($request->get_param('date'));
        
        $raw_service_ids = $request->get_param('service_ids') ?: $request->get_param('service_id');
        $service_ids = !empty($raw_service_ids)
            ? array_filter(array_map('intval', explode(',', sanitize_text_field($raw_service_ids))))
            : [];

        if (empty($date)) {
            return new WP_Error('missing_params', 'Date is required.', ['status' => 400]);
        }
        if (empty($service_ids)) {
            return new WP_Error('missing_params', 'At least one service ID is required.', ['status' => 400]);
        }

        $qualified_emp_ids = \IgniteBookings\Utils\MultiServiceScheduler::getQualifiedEmployees($service_ids);
        if (empty($qualified_emp_ids)) {
            return rest_ensure_response([]);
        }

        if ($employee_id === 0) {
            $slots = \IgniteBookings\Utils\MultiServiceScheduler::getMultiServiceAvailableSlots($qualified_emp_ids, $service_ids, $date);
        } else {
            if (!in_array($employee_id, $qualified_emp_ids, true)) {
                return rest_ensure_response([]);
            }
            $metrics = \IgniteBookings\Utils\MultiServiceScheduler::calculateBasketMetrics($service_ids);
            $total_duration = $metrics['total_duration'];
            try {
                $primary_id = $service_ids[0];
                $raw_slots = SlotGenerator::getAvailableSlots($employee_id, $primary_id, $date);
                $slots = [];
                foreach ($raw_slots as $slot) {
                    $parts = explode(' ', $slot['start']);
                    $clean_time = substr($parts[1], 0, 5);
                    $start_min = ((int)substr($clean_time, 0, 2) * 60) + (int)substr($clean_time, 3, 2);
                    $end_min = $start_min + $total_duration;
                    $slots[] = [
                        'start' => $slot['start'],
                        'end'   => sprintf('%s %02d:%02d:00', $date, (int)floor($end_min / 60), $end_min % 60),
                    ];
                }
            } catch (\Throwable $e) {
                return new WP_Error('generator_error', 'Slot generation failed: ' . $e->getMessage(), ['status' => 500]);
            }
        }

        $today_local = current_time('Y-m-d');
        if ($date === $today_local) {
            $current_local_timestamp = current_time('mysql');
            $filtered_slots = [];
            foreach ($slots as $slot) {
                if ($slot['start'] >= $current_local_timestamp) {
                    $filtered_slots[] = $slot;
                }
            }
            return rest_ensure_response($filtered_slots);
        }

        return rest_ensure_response($slots);
    }

    public function get_available_staff($request) {
        global $wpdb;
        $date = sanitize_text_field($request->get_param('date'));
        $target_time = sanitize_text_field($request->get_param('time'));
        
        $raw_service_ids = $request->get_param('service_ids') ?: $request->get_param('service_id');
        $service_ids = !empty($raw_service_ids)
            ? array_filter(array_map('intval', explode(',', sanitize_text_field($raw_service_ids))))
            : [];

        if (empty($date) || empty($target_time)) {
            return rest_ensure_response([]);
        }
        if (empty($service_ids)) {
            return new WP_Error('missing_params', 'At least one service ID is required.', ['status' => 400]);
        }

        $qualified_emp_ids = \IgniteBookings\Utils\MultiServiceScheduler::getQualifiedEmployees($service_ids);
        if (empty($qualified_emp_ids)) {
            return rest_ensure_response([]);
        }

        $emp_table = $wpdb->prefix . 'ignite_employees';
        $ids_placeholder = implode(',', $qualified_emp_ids);
        $employees = $wpdb->get_results(
            "SELECT id, first_name, last_name, avatar_url FROM $emp_table WHERE id IN ($ids_placeholder) AND is_active = 1"
        );

        $qualified_staff = [];
        $target_start_timestamp = "{$date} " . trim($target_time) . ":00";

        foreach ($employees as $staff) {
            $slots = SlotGenerator::getAvailableSlots((int)$staff->id, (int)$service_ids[0], $date);
            foreach ($slots as $slot) {
                if (trim($slot['start']) === $target_start_timestamp) {
                    $qualified_staff[] = $staff;
                    break;
                }
            }
        }
        return rest_ensure_response($qualified_staff);
    }

    public function get_capable_staff_count($request): WP_REST_Response {
        global $wpdb;
        $raw = $request->get_param('service_ids') ?: $request->get_param('service_id');
        if (empty($raw)) {
            return rest_ensure_response(['status' => 'empty']);
        }
        
        $service_ids = array_filter(array_map('intval', explode(',', sanitize_text_field($raw))));
        $pivot_table = $wpdb->prefix . 'ignite_employee_services';

        foreach ($service_ids as $id) {
            $has_any_staff = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $pivot_table WHERE service_id = %d AND is_active = 1", 
                $id
            ));
            if ((int)$has_any_staff === 0) {
                return rest_ensure_response(['status' => 'unassigned', 'service_id' => $id]);
            }
        }

        $qualified_ids = \IgniteBookings\Utils\MultiServiceScheduler::getQualifiedEmployees($service_ids);
        if (empty($qualified_ids)) {
            return rest_ensure_response(['status' => 'impossible_combination']);
        }
        return rest_ensure_response(['status' => 'valid']);
    }
}
