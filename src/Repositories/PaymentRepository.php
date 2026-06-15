<?php
namespace IgniteBookings\Repositories;

class PaymentRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_payments';
    }

    public function getByTransactionId(string $txn_id) {
        global $wpdb;
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table} WHERE transaction_id = %s", $txn_id));
    }

    /**
     * Recalculates and synchronizes paid amounts directly inside the appointments table.
     * Never trusts raw values without running this query sync block first.
     */
    public function syncAppointmentPaidAmount(int $appointment_id): void {
        global $wpdb;
        $appt_table = $wpdb->prefix . 'ignite_appointments';

        // Calculate the total sum of all completed payments for this appointment
        $total_paid = (float) $wpdb->get_var($wpdb->prepare(
            "SELECT SUM(amount) FROM {$this->table} WHERE appointment_id = %d AND status = 'completed'", 
            $appointment_id
        ));

        // Sync the updated amount directly to the appointment table row
        $wpdb->update($appt_table, ['paid_amount' => $total_paid], ['id' => $appointment_id], ['%f'], ['%d']);
    }
}
