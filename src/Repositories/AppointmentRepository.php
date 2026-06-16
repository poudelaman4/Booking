<?php
namespace IgniteBookings\Repositories;

if (!defined('ABSPATH')) exit;

class AppointmentRepository {
    private string $table;
    private string $customers_table;
    private string $employees_table;

    public function __construct() {
        global $wpdb;
        // 🌟 MAP DIRECTLY TO VERIFIED SYSTEM PREFIX NAMES
        $this->table           = $wpdb->prefix . 'ignite_appointments';
        $this->customers_table = $wpdb->prefix . 'ignite_customers';
        $this->employees_table = $wpdb->prefix . 'ignite_employees';
    }

    /**
     * 🧠 AUDIT REFACTOR: Fetches all core appointments along with relational customer and employee data strings.
     */
    public function getAppointmentsWithMeta(): array {
        global $wpdb;
        return $wpdb->get_results("
            SELECT 
                a.*,
                e.first_name AS employee_name,
                CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone
            FROM {$this->table} a
            LEFT JOIN {$this->customers_table} c ON a.customer_id = c.id
            LEFT JOIN {$this->employees_table} e ON a.employee_id = e.id
            ORDER BY a.start_time ASC
        ", ARRAY_A) ?: [];
    }

    /**
     * Verifies if a given customer ID exists inside the database ledger.
     */
    public function verifyCustomerExists(int $customer_id): bool {
        global $wpdb;
        $id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->customers_table} WHERE id = %d LIMIT 1",
            $customer_id
        ));
        return !empty($id);
    }

    /**
     * Verifies if a given employee ID exists inside the database ledger.
     */
    public function verifyStaffExists(int $employee_id): bool {
        global $wpdb;
        $id = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->employees_table} WHERE id = %d LIMIT 1",
            $employee_id
        ));
        return !empty($id);
    }

    /**
     * Permanent data row extraction delete pathway method.
     */
    public function delete(int $id): bool {
        global $wpdb;
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
