<?php
namespace IgniteBookings\Repositories;

class AvailabilityExceptionsRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_employee_availability_exceptions';
    }

    public function addException(array $data): bool {
        global $wpdb;
        return $wpdb->insert($this->table, [
            'employee_id'    => (int) $data['employee_id'],
            'exception_date' => sanitize_text_field($data['exception_date']),
            'exception_type' => sanitize_text_field($data['exception_type'] ?: 'blocked'),
            'start_time'     => !empty($data['start_time']) ? sanitize_text_field($data['start_time']) : null,
            'end_time'       => !empty($data['end_time']) ? sanitize_text_field($data['end_time']) : null,
            'reason'         => !empty($data['reason']) ? sanitize_text_field($data['reason']) : null,
        ]) !== false;
    }
}
