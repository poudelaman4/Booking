<?php

namespace IgniteBookings\Database\Tables;

class CustomersTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_customers';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NULL,
            email VARCHAR(255) NULL,
            phone VARCHAR(50) NULL,
            timezone VARCHAR(50) DEFAULT 'UTC',
            total_appointments INT DEFAULT 0,
            total_spent DECIMAL(10,2) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY email_unique (email),
            KEY phone_idx (phone),
            KEY created_idx (created_at)
        ) $charset;";
    }
}
