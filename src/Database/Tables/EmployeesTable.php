<?php
namespace IgniteBookings\Database\Tables;

class EmployeesTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_employees';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            wp_user_id BIGINT UNSIGNED NULL,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NULL,
            avatar_url VARCHAR(255) NULL,
            bio TEXT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY email_unique (email),
            UNIQUE KEY unique_wp_user (wp_user_id), -- 🌟 Enforces strict one-to-one account boundaries
            KEY wp_user_idx (wp_user_id),
            KEY active_idx (is_active)
        ) $charset;";
    }
}
