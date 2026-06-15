<?php

namespace IgniteBookings\Database\Tables;

class AppointmentsTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_appointments';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            service_id BIGINT UNSIGNED NOT NULL,
            employee_id BIGINT UNSIGNED NOT NULL,
            customer_id BIGINT UNSIGNED NOT NULL,
            package_id BIGINT UNSIGNED NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            price DECIMAL(10,2) DEFAULT 0,
            paid_amount DECIMAL(10,2) DEFAULT 0,
            notes TEXT NULL,
            cancellation_reason VARCHAR(255) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            cancelled_at DATETIME NULL,
            PRIMARY KEY  (id),
            KEY service_idx (service_id),
            KEY emp_idx (employee_id),
            KEY customer_idx (customer_id),
            KEY package_idx (package_id),
            KEY time_idx (start_time),
            KEY status_idx (status),
            KEY created_idx (created_at)
        ) $charset;";
    }
}
