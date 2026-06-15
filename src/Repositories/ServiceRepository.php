<?php
namespace IgniteBookings\Repositories;

class ServiceRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_services';
    }

    public function delete(int $id): bool {
        global $wpdb;
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
