<?php
namespace IgniteBookings\Repositories;

class NotificationRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_notifications';
    }

    /**
     * Fetches queued notifications for WP-Cron execution
     */
    public function getQueued(int $limit = 10): array {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->table} WHERE status = 'queued' LIMIT %d", 
            $limit
        ));
    }

    /**
     * Hard-deletes historical log entries older than N days
     */
    public function cleanOldLogs(int $days_old): int {
        global $wpdb;
        return (int) $wpdb->query($wpdb->prepare(
            "DELETE FROM {$this->table} WHERE (status = 'sent' OR status = 'failed') AND created_at < DATE_SUB(NOW(), INTERVAL %d DAY)", 
            $days_old
        ));
    }
}
