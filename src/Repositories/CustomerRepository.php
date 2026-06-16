<?php
namespace IgniteBookings\Repositories;

if (!defined('ABSPATH')) exit;

class CustomerRepository {
    protected string $table;
    protected string $appointments_table;
    protected string $employees_table;
    protected string $services_table;

    public function __construct() {
        global $wpdb;
        $this->table              = $wpdb->prefix . 'ignite_customers';
        $this->appointments_table = $wpdb->prefix . 'ignite_appointments';
        $this->employees_table    = $wpdb->prefix . 'ignite_employees';
        $this->services_table     = $wpdb->prefix . 'ignite_services';
    }

    /**
     * 🔮 HIGH-PERFORMANCE 2-PASS INGESTION ENGINE: Abstracted out of the controller layer [INDEX].
     * Consolidates loop calls into exactly 2 database roundtrips to crush N+1 bottlenecks [INDEX]!
     */
    public function getCustomersWithAppointments(): array {
        global $wpdb;
        $wpdb->hide_errors();

        // PASS 1: Batch fetch all core customer records [INDEX]
        $customers = $wpdb->get_results("SELECT * FROM {$this->table} ORDER BY id DESC", ARRAY_A);
        if (empty($customers)) {
            return [];
        }

        $customer_ids = array_map(function($c) { return (int)$c['id']; }, $customers);
        $ids_string   = implode(',', $customer_ids);

        // PASS 2: Batch fetch ALL appointments for ALL matched clients in a single sweep [INDEX]
        $all_appointments = $wpdb->get_results(
            "SELECT * FROM {$this->appointments_table} WHERE customer_id IN ($ids_string) ORDER BY start_time DESC",
            ARRAY_A
        );

        // Warm up internal lookup caches to eliminate nested sub-query loops [INDEX]
        $employees_cache = $wpdb->get_results("SELECT id, first_name, last_name FROM {$this->employees_table}", ARRAY_A);
        $employees_map   = array_column($employees_cache, null, 'id');

        $services_cache  = $wpdb->get_results("SELECT id, name FROM {$this->services_table}", ARRAY_A);
        $services_map    = array_column($services_cache, 'name', 'id');

        $grouped_appointments = [];
        if (!empty($all_appointments)) {
            foreach ($all_appointments as $appt) {
                $emp_id = (int)$appt['employee_id'];
                $appt['employee_name'] = isset($employees_map[$emp_id])
                    ? trim($employees_map[$emp_id]['first_name'] . ' ' . ($employees_map[$emp_id]['last_name'] ?? ''))
                    : 'Specialist';

                $srv_id = (int)$appt['service_id'];
                $appt['service_name'] = isset($services_map[$srv_id]) ? $services_map[$srv_id] : 'Service Session';

                $ts                  = !empty($appt['start_time']) ? strtotime($appt['start_time']) : time();
                $appt['booking_date'] = date('Y-m-d', $ts);
                $appt['booking_time'] = date('H:i:s', $ts);

                $appt['duration']       = $appt['duration'] ?? 30;
                $appt['buffer_after']   = $appt['buffer_after'] ?? 0;
                $appt['internal_notes'] = $appt['internal_notes'] ?? ($appt['notes'] ?? null);

                $c_id = (int)$appt['customer_id'];
                $grouped_appointments[$c_id][] = $appt;
            }
        }

        // Combine lookups inside memory context arrays [INDEX]
        foreach ($customers as &$customer) {
            $customer_id = (int)$customer['id'];
            $total_visits = 0;
            $total_spend  = 0.00;

            if (isset($grouped_appointments[$customer_id])) {
                $appts = $grouped_appointments[$customer_id];
                foreach ($appts as $appt) {
                    if (strtolower($appt['status'] ?? '') !== 'cancelled') {
                        $total_visits++;
                        $total_spend += (float)($appt['price'] ?? 0);
                    }
                }
                $customer['appointments'] = $appts;
            } else {
                $customer['appointments'] = [];
            }

            $customer['total_appointments'] = $total_visits;
            $customer['total_spent']        = $total_spend;
        }
        unset($customer);

        return $customers;
    }

    /**
     * Checks for an existing user row by matching their exact email signature token string [INDEX].
     */
    public function findByEmail(string $email): ?array {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table} WHERE email = %s LIMIT 1",
            $email
        ), ARRAY_A);
        return $row ?: null;
    }

    /**
     * Commits a fresh customer entry data sheet into the database table [INDEX].
     */
    public function insert(array $data): int|bool {
        global $wpdb;
        $result = $wpdb->insert($this->table, $data);
        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Mutates an active customer profile data column block by primary key ID [INDEX].
     */
    public function update(int $id, array $data): bool {
        global $wpdb;
        $result = $wpdb->update($this->table, $data, ['id' => $id]);
        return $result !== false;
    }

    /**
     * 🧠 REFACTOR CASCADE DELETE: Sweeps orphaned data records from history ledger blocks dynamically [INDEX].
     */
    public function delete(int $id): bool {
        global $wpdb;
        // Step A: Sweep appointments table to clear dependent orphan references first [INDEX]
        $wpdb->delete($this->appointments_table, ['customer_id' => $id], ['%d']);
        
        // Step B: Hard-delete primary client passport entry record [INDEX]
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
