<?php
namespace IgniteBookings\Repositories;

class CustomerRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_customers';
    }

    public function delete(int $id): bool {
        global $wpdb;
        // Direct hard delete. Blocked safely by fk_appt_customer RESTRICT schema rule if appointment history exists.
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
