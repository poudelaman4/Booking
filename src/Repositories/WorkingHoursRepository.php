<?php
namespace IgniteBookings\Repositories;

if (!defined('ABSPATH')) exit;

class WorkingHoursRepository {
    private string $table;
    private string $exceptions_table;

    public function __construct() {
        global $wpdb;
        $this->table            = $wpdb->prefix . 'ignite_working_hours';
        // 🌟 AUDIT CORRECTION: Points to the verified table name to kill potential background slot crashes [INDEX]
        $this->exceptions_table = $wpdb->prefix . 'ignite_availability_exceptions';
    }

    /**
     * Fetches active working hour entries from the database, ordered by day of the week [INDEX].
     */
    public function getHoursByEmployee(int $employee_id): array {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->table} WHERE employee_id = %d ORDER BY day_of_week ASC", 
            $employee_id
        ), OBJECT) ?: [];
    }

    /**
     * Bulk upserts schedules using the unique constraint (employee_id, day_of_week) with break times [INDEX].
     */
    public function upsertHours(int $employee_id, array $schedules): void {
        global $wpdb;
        foreach ($schedules as $sched) {
            $day_of_week = (int)$sched['day_of_week'];
            $start_time  = sanitize_text_field($sched['start_time']);
            $end_time    = sanitize_text_field($sched['end_time']);
            $is_day_off  = (int)$sched['is_day_off'];

            $break_start = !empty($sched['break_start']) ? sanitize_text_field($sched['break_start']) : null;
            $break_end   = !empty($sched['break_end']) ? sanitize_text_field($sched['break_end']) : null;

            $wpdb->query($wpdb->prepare(
                "INSERT INTO {$this->table} (employee_id, day_of_week, start_time, end_time, break_start, break_end, is_day_off) 
                 VALUES (%d, %d, %s, %s, %s, %s, %d) 
                 ON DUPLICATE KEY UPDATE start_time = %s, end_time = %s, break_start = %s, break_end = %s, is_day_off = %d",
                $employee_id, $day_of_week, $start_time, $end_time, $break_start, $break_end, $is_day_off,
                $start_time, $end_time, $break_start, $break_end, $is_day_off
            ));
        }
    }

    /**
     * Wipes any existing duplicate exceptions on a specific date for an employee [INDEX].
     */
    public function clearDuplicateException(int $employee_id, string $exception_date): void {
        global $wpdb;
        $wpdb->delete($this->exceptions_table, [
            'employee_id'    => $employee_id, 
            'exception_date' => $exception_date
        ], ['%d', '%s']);
    }

    /**
     * Persists a clean day-off or custom leave exception rule into the table ledger [INDEX].
     */
    public function insertException(array $data): int|bool {
        global $wpdb;
        $inserted = $wpdb->insert($this->exceptions_table, $data);
        return $inserted ? $wpdb->insert_id : false;
    }
}
