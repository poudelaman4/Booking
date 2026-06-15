<?php

namespace IgniteBookings\Database\Tables;

class EmployeeServicesTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_employee_services';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id BIGINT UNSIGNED NOT NULL,
            service_id BIGINT UNSIGNED NOT NULL,
            custom_price DECIMAL(10,2) NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY emp_service_unq (employee_id, service_id),
            KEY emp_idx (employee_id),
            KEY service_idx (service_id),
            KEY active_idx (is_active)
        ) $charset;";
    }
}
