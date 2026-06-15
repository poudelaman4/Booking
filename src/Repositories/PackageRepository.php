<?php
namespace IgniteBookings\Repositories;

class PackageRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_packages';
    }

    public function delete(int $id): bool {
        global $wpdb;
        // DB automatically drops package_services rows and converts ignite_appointments.package_id to NULL.
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
