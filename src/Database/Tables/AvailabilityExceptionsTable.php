<?php

namespace IgniteBookings\Database\Tables;

class AvailabilityExceptionsTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_employee_availability_exceptions';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id BIGINT UNSIGNED NOT NULL,
            exception_date DATE NOT NULL,
            exception_type VARCHAR(50) DEFAULT 'blocked',
            start_time TIME NULL,
            end_time TIME NULL,
            reason VARCHAR(255) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY employee_idx (employee_id),
            KEY date_idx (exception_date),
            KEY type_idx (exception_type)
        ) $charset;";
    }
}
