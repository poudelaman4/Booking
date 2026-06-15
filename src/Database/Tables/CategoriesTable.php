<?php

namespace IgniteBookings\Database\Tables;

class CategoriesTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_service_categories';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            parent_id BIGINT UNSIGNED NULL,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            image_url VARCHAR(255) NULL, -- 🌟 Added premium placeholder field
            description TEXT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY slug_unique (slug),
            KEY parent_idx (parent_id),
            KEY active_idx (is_active)
        ) $charset;";
    }
}
