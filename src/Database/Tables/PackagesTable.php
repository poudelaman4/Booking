<?php

namespace IgniteBookings\Database\Tables;

class PackagesTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_packages';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT NULL,
            price DECIMAL(10,2) NOT NULL,
            total_bookings INT NOT NULL DEFAULT 1,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY slug_unique (slug),
            KEY active_idx (is_active)
        ) $charset;";
    }
}
