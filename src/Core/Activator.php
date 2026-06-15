<?php

namespace IgniteBookings\Core;

use IgniteBookings\Database\Schema;

class Activator {

    public static function activate() {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $tables = Schema::getTables();

        foreach ($tables as $table) {
            dbDelta($table->sql());
        }
    }
}