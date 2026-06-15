<?php

namespace IgniteBookings\Database\Tables;

class PackageServicesTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_package_services';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            package_id BIGINT UNSIGNED NOT NULL,
            service_id BIGINT UNSIGNED NOT NULL,
            quantity INT UNSIGNED DEFAULT 1,
            PRIMARY KEY  (id),
            UNIQUE KEY pkg_service_unq (package_id, service_id),
            KEY package_idx (package_id),
            KEY service_idx (service_id)
        ) $charset;";
    }
}
