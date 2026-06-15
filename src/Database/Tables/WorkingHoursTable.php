<?php

namespace IgniteBookings\Database\Tables;

class WorkingHoursTable implements TableInterface {

    public function name(): string {
        global $wpdb;
        return $wpdb->prefix . 'ignite_working_hours';
    }

    public function sql(): string {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $table = $this->name();

        return "CREATE TABLE $table (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            employee_id BIGINT UNSIGNED NOT NULL,
            day_of_week TINYINT UNSIGNED NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            break_start TIME NULL,     -- 🌟 Tells the system when the break begins
            break_end TIME NULL,       -- 🌟 Tells the system when the staff member returns
            is_day_off TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY emp_day_unq (employee_id, day_of_week),
            KEY employee_idx (employee_id),
            KEY day_idx (day_of_week)
        ) $charset;";
    }
}
