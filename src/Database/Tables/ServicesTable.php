<?php

namespace IgniteBookings\Database\Tables;

class ServicesTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_services';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            category_id BIGINT UNSIGNED NULL,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT NULL,
            image_url TEXT NULL, 
            duration INT NOT NULL, 
            price DECIMAL(10,2) NOT NULL,
            buffer_before INT DEFAULT 0, 
            buffer_after INT DEFAULT 0, 
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY slug_unique (slug),
            KEY category_idx (category_id),
            KEY active_idx (is_active)
        ) $charset;";
    }
}
