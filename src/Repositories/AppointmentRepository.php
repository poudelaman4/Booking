<?php
namespace IgniteBookings\Repositories;

class AppointmentRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_appointments';
    }

    public function delete(int $id): bool {
        global $wpdb;
        // DB automatically cascades and deletes related rows inside ignite_notifications table.
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
