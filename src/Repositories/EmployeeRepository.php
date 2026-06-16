<?php
namespace IgniteBookings\Repositories;

if (!defined('ABSPATH')) exit;

class EmployeeRepository {
    private string $table;
    private string $pivot_table;
    private string $services_table;

    public function __construct() {
        global $wpdb;
        $this->table          = $wpdb->prefix . 'ignite_employees';
        $this->pivot_table    = $wpdb->prefix . 'ignite_employee_services';
        $this->services_table = $wpdb->prefix . 'ignite_services';
    }

    /**
     * Finds a single employee by their primary key ID.
     */
    public function find(int $id): ?array {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table} WHERE id = %d LIMIT 1",
            $id
        ), ARRAY_A);
        return $row ?: null;
    }

    /**
     * Fetches employee listings with an optional wildcard name search parameter.
     */
    public function searchStaff(string $search = ''): array {
        global $wpdb;
        if (!empty($search)) {
            $wildcard = '%' . $wpdb->esc_like($search) . '%';
            return $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE first_name LIKE %s OR last_name LIKE %s ORDER BY id DESC",
                $wildcard, $wildcard
            ), ARRAY_A) ?: [];
        }
        return $wpdb->get_results("SELECT * FROM {$this->table} ORDER BY id DESC", ARRAY_A) ?: [];
    }

    /**
     * Checks if an email address is already locked onto an existing employee.
     */
    public function checkEmailExists(string $email): bool {
        global $wpdb;
        $id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->table} WHERE email = %s LIMIT 1",
            $email
        ));
        return !empty($id);
    }

    /**
     * Inserts a fresh employee record row entry.
     */
    public function insert(array $data): int|bool {
        global $wpdb;
        $result = $wpdb->insert($this->table, $data);
        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Updates an existing employee data block.
     */
    public function update(int $id, array $data): bool {
        global $wpdb;
        $result = $wpdb->update($this->table, $data, ['id' => $id]);
        return $result !== false;
    }

    /**
     * Gets all services assigned to a specific employee via inner join loops.
     */
    public function getAssignedServices(int $employee_id): array {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare(
            "SELECT s.*, es.custom_price, es.is_active as assignment_active 
             FROM {$this->services_table} s 
             INNER JOIN {$this->pivot_table} es ON s.id = es.service_id 
             WHERE es.employee_id = %d",
            $employee_id
        ), ARRAY_A) ?: [];
    }

    /**
     * Syncs service mappings by clearing old rows and inserting fresh batches.
     */
    public function syncAssignedServices(int $employee_id, array $services): void {
        global $wpdb;
        $wpdb->delete($this->pivot_table, ['employee_id' => $employee_id], ['%d']);
        foreach ($services as $service) {
            $service_id = (int)$service['service_id'];
            $custom_price = isset($service['custom_price']) ? (float)$service['custom_price'] : null;
            $wpdb->insert($this->pivot_table, [
                'employee_id'  => $employee_id,
                'service_id'   => $service_id,
                'custom_price' => $custom_price,
                'is_active'    => 1
            ]);
        }
    }

    /**
     * Helper to grab a single wp_user_id link safely.
     */
    public function getWordPressUserId(int $id): ?int {
        global $wpdb;
        $uid = $wpdb->get_var($wpdb->prepare(
            "SELECT wp_user_id FROM {$this->table} WHERE id = %d LIMIT 1",
            $id
        ));
        return $uid ? (int)$uid : null;
    }

    /**
     * Baseline hard delete execution gateway.
     */
    public function delete(int $id): bool {
        global $wpdb;
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
