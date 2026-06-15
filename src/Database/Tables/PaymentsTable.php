<?php

namespace IgniteBookings\Database\Tables;

class PaymentsTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_payments';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            appointment_id BIGINT UNSIGNED NOT NULL,
            transaction_id VARCHAR(255) NULL,
            gateway VARCHAR(100) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY appointment_idx (appointment_id),
            KEY transaction_idx (transaction_id),
            KEY status_idx (status)
        ) $charset;";
    }
}
