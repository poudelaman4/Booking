<?php

namespace IgniteBookings\Database\Tables;

class NotificationsTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_notifications';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            appointment_id BIGINT UNSIGNED NOT NULL,
            type VARCHAR(100) NOT NULL,
            recipient_email VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'queued',
            sent_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY appointment_idx (appointment_id),
            KEY type_idx (type),
            KEY status_idx (status)
        ) $charset;";
    }
}
