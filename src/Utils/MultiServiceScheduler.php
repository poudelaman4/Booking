<?php
namespace IgniteBookings\Utils;

class MultiServiceScheduler {

    /**
     * Finds all employee IDs who are qualified to handle EVERY service in the basket.
     */
    public static function getQualifiedEmployees(array $service_ids): array {
        global $wpdb;
        if (empty($service_ids)) {
            return [];
        }

        $pivot_table = $wpdb->prefix . 'ignite_employee_services';
        $service_ids = array_map('intval', $service_ids);
        $ids_placeholder = implode(',', $service_ids);
        $required_count = count(array_unique($service_ids));

        // SQL GROUP BY HAVING filter: ensures an employee has entries for ALL required service keys [INDEX]
        $results = $wpdb->get_col("
            SELECT employee_id 
            FROM $pivot_table 
            WHERE service_id IN ($ids_placeholder) AND is_active = 1 
            GROUP BY employee_id 
            HAVING COUNT(DISTINCT service_id) = $required_count
        ");

        return array_map('intval', $results);
    }

    /**
     * Calculates the true cumulative duration and latest available padding boundaries from the database rows.
     */
    public static function calculateBasketMetrics(array $service_ids): array {
        global $wpdb;
        if (empty($service_ids)) {
            return ['total_duration' => 30, 'max_buffer' => 0];
        }

        $services_table = $wpdb->prefix . 'ignite_services';
        $service_ids = array_map('intval', $service_ids);
        $ids_placeholder = implode(',', $service_ids);

        $rows = $wpdb->get_results("SELECT duration, buffer_after FROM $services_table WHERE id IN ($ids_placeholder)", ARRAY_A);

        $total_duration = 0;
        $max_buffer = 0;

        foreach ($rows as $row) {
            $total_duration += (int)$row['duration'];
            if ((int)$row['buffer_after'] > $max_buffer) {
                $max_buffer = (int)$row['buffer_after'];
            }
        }

        return [
            'total_duration' => $total_duration > 0 ? $total_duration : 30,
            'max_buffer'     => $max_buffer
        ];
    }

    /**
     * Generates cumulative time slots by checking availability window parameters across multiple employees.
     */
    public static function getMultiServiceAvailableSlots(array $employee_ids, array $service_ids, string $date): array {
        if (empty($employee_ids) || empty($service_ids)) {
            return [];
        }

        $metrics = self::calculateBasketMetrics($service_ids);
        $total_duration = $metrics['total_duration'];

        $master_slots = [];

        foreach ($employee_ids as $emp_id) {
            // Re-use your baseline dynamic walking engine using the combined total duration block [INDEX]
            // Pass service_ids[0] safely to parse working hours, but validate total timeline width natively [INDEX]
            $slots = SlotGenerator::getAvailableSlots($emp_id, $service_ids[0], $date);
            
            foreach ($slots as $slot) {
                // Parse standard date strings into minutes offsets
                $start_parts = explode(' ', $slot['start']);
                if (!isset($start_parts[1])) continue;
                $clean_time = substr($start_parts[1], 0, 5);

                $start_min = ((int)substr($clean_time, 0, 2) * 60) + (int)substr($clean_time, 3, 2);
                $end_min = $start_min + $total_duration;

                // Build a unified chronological list layout map
                $formatted_end = sprintf('%s %02d:%02d:00', $date, (int)floor($end_min / 60), $end_min % 60);

                $master_slots[$clean_time] = [
                    'start' => $slot['start'],
                    'end'   => $formatted_end
                ];
            }
        }

        ksort($master_slots);
        return array_values($master_slots);
    }
}
