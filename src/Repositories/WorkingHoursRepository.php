<?php
namespace IgniteBookings\Repositories;

class WorkingHoursRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_working_hours';
    }

    /**
     * Bulk upserts using the schema's unique constraint (employee_id, day_of_week)
     */
    public function upsertHours(int $employee_id, array $schedules): void {
        global $wpdb;
        foreach ($schedules as $sched) {
            $day = (int) $sched['day_of_week'];
            $start = sanitize_text_field($sched['start_time']);
            $end = sanitize_text_field($sched['end_time']);
            $off = (int) $sched['is_day_off'];

            $wpdb->query($wpdb->prepare(
                "INSERT INTO {$this->table} (employee_id, day_of_week, start_time, end_time, is_day_off) 
                 VALUES (%d, %d, %s, %s, %d) 
                 ON DUPLICATE KEY UPDATE start_time = %s, end_time = %s, is_day_off = %d",
                $employee_id, $day, $start, $end, $off, $start, $end, $off
            ));
        }
    }
}
