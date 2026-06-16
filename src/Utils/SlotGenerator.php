<?php
namespace IgniteBookings\Utils;

class SlotGenerator {

    // Converts '09:00:00' or '2026-06-15 09:00:00' → minutes from midnight
    private static function timeToMinutes(string $time_str): int {
        $time_str = trim($time_str);
        $part     = strpos($time_str, ' ') !== false ? explode(' ', $time_str)[1] : $time_str;
        $segments = explode(':', $part);
        return count($segments) < 2 ? 0 : ((int)$segments[0] * 60) + (int)$segments[1];
    }

    // Returns working window for the day, or null if blocked/day-off
    private static function getWorkingWindow(int $employee_id, string $date): ?array {
        global $wpdb;

        $exception = $wpdb->get_row($wpdb->prepare(
            "SELECT exception_type, start_time, end_time 
             FROM {$wpdb->prefix}ignite_availability_exceptions
             WHERE employee_id = %d AND exception_date = %s LIMIT 1",
            $employee_id, $date
        ));

        if ($exception) {
            if ($exception->exception_type === 'blocked') return null;
            if ($exception->exception_type === 'custom_hours') {
                return ['start' => $exception->start_time, 'end' => $exception->end_time, 'break_start' => null, 'break_end' => null];
            }
        }

        $day = $wpdb->get_row($wpdb->prepare(
            "SELECT start_time, end_time, break_start, break_end 
             FROM {$wpdb->prefix}ignite_working_hours
             WHERE employee_id = %d AND day_of_week = %d AND is_day_off = 0 LIMIT 1",
            $employee_id, (int)date('w', strtotime($date))
        ));

        if (!$day) return null;

        return [
            'start'       => $day->start_time,
            'end'         => $day->end_time,
            'break_start' => $day->break_start,
            'break_end'   => $day->break_end,
        ];
    }

    // Builds sorted list of blocked time ranges (breaks + existing bookings)
    private static function getBlockades(int $employee_id, string $date, ?string $break_start, ?string $break_end): array {
        global $wpdb;

        $blockades = [];

        if ($break_start && $break_end && $break_start !== '00:00:00' && $break_end !== '00:00:00') {
            $blockades[] = ['start' => self::timeToMinutes($break_start), 'end' => self::timeToMinutes($break_end)];
        }

        $bookings = $wpdb->get_results($wpdb->prepare(
            "SELECT start_time, end_time FROM {$wpdb->prefix}ignite_appointments
             WHERE employee_id = %d AND DATE(start_time) = %s AND status NOT IN ('cancelled', 'no_show')",
            $employee_id, $date
        ));

        foreach ($bookings as $b) {
            $blockades[] = ['start' => self::timeToMinutes($b->start_time), 'end' => self::timeToMinutes($b->end_time)];
        }

        usort($blockades, fn($a, $b) => $a['start'] <=> $b['start']);
        return $blockades;
    }

    /**
     * 🛡️ SECURED RESOLVER: Protects your calendar from historical booking exploits.
     */
    private static function resolveStartMin(int $start_min, string $date): int {
        $today = current_time('Y-m-d');
        
        if (strtotime($date) < strtotime($today)) {
            return 9999; // Breaks the walking loop safely
        }
        
        if ($date !== $today) return $start_min;
        
        // 🌟 TIME BUFFER CORRECTION: Forces the starting point to align with the current real-time clock
        $now = ((int)current_time('H') * 60) + (int)current_time('i');
        return $now > $start_min ? (int)ceil($now / 15) * 15 : $start_min;
    }

    private static function formatSlotTime(string $date, int $mins): string {
        return sprintf('%s %02d:%02d:00', $date, (int)floor($mins / 60), $mins % 60);
    }

    public static function getAvailableSlots(int $employee_id, int $service_id, string $date): array {
        global $wpdb;

        if (!$employee_id || !$service_id || empty($date)) return [];

        $service = $wpdb->get_row($wpdb->prepare(
            "SELECT s.duration FROM {$wpdb->prefix}ignite_services s
             JOIN {$wpdb->prefix}ignite_employee_services p ON s.id = p.service_id
             WHERE s.id = %d AND p.employee_id = %d AND p.is_active = 1 LIMIT 1",
            $service_id, $employee_id
        ));
        if (!$service) return [];

        $duration = !empty($service->duration) ? (int)$service->duration : 30;
        $window   = self::getWorkingWindow($employee_id, $date);
        if (!$window) return [];

        $start_min = self::timeToMinutes($window['start']);
        $end_min   = self::timeToMinutes($window['end']);

        // 🌟 APPLY CHRONOLOGICAL GUARD: Enforces the real-time buffer over the walking sequence pointer immediately
        $start_min = self::resolveStartMin($start_min, $date);
        if ($start_min >= $end_min) return [];

        $blockades   = self::getBlockades($employee_id, $date, $window['break_start'], $window['break_end']);
        $slots       = [];
        $current_min = $start_min;

        // Walk the timeline, jumping over blockades, collecting free slots
        while ($current_min + $duration <= $end_min) {
            $slot_end      = $current_min + $duration;
            $collision_end = null;

            // 🌟 INLINE LIVE TIME DOUBLE-CHECK GUARD: If today is selected, verify each slot isn't in the past
            if ($date === current_time('Y-m-d')) {
                $now_minutes = ((int)current_time('H') * 60) + (int)current_time('i');
                if ($current_min < $now_minutes) {
                    $current_min += 15; // Advance pointer past expired slot windows
                    continue;
                }
            }

            foreach ($blockades as $block) {
                if ($current_min < $block['end'] && $slot_end > $block['start']) {
                    $collision_end = $block['end'];
                    break;
                }
            }

            if ($collision_end !== null) {
                $current_min = $collision_end; // Jump past the blockade
                continue;
            }

            $slots[]     = ['start' => self::formatSlotTime($date, $current_min), 'end' => self::formatSlotTime($date, $slot_end)];
            // Step forward cleanly by 15-minute intervals for dynamic availability matching
            $current_min += 15; 
        }

        return $slots;
    }
}
