<?php
namespace IgniteBookings\Repositories;

if (!defined('ABSPATH')) exit;

class ServiceRepository {
    private string $table_name;
    private string $categories_table;

    public function __construct() {
        global $wpdb;
        $this->table_name       = $wpdb->prefix . 'ignite_services';
        $this->categories_table = $wpdb->prefix . 'ignite_service_categories';
    }

    /**
     * Finds a single service offering record entry by its primary key ID.
     */
    public function find(int $id): ?array {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d LIMIT 1",
            $id
        ), ARRAY_A);
        return $row ?: null;
    }

    /**
     * 🧠 FIX UNLOCKED: Handles loose active typing (supports strings 'active' or integer states cleanly)
     */
    public function findAll(array $args = []): array {
        global $wpdb;
        $where = ["1=1"];
        $params = [];

        if (isset($args['is_active'])) {
            // Check if database columns utilize numeric strings or standard character words safely
            if (is_numeric($args['is_active'])) {
                $where[] = "(is_active = %d OR is_active = 'active')";
                $params[] = (int)$args['is_active'];
            } else {
                $where[] = "is_active = %s";
                $params[] = sanitize_text_field($args['is_active']);
            }
        }

        if (!empty($args['category_id'])) {
            $where[] = "category_id = %d";
            $params[] = (int)$args['category_id'];
        }

        $where_clause = implode(" AND ", $where);
        
        $sql = "SELECT * FROM {$this->table_name} WHERE {$where_clause} ORDER BY name ASC";
        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        return $wpdb->get_results($sql, ARRAY_A) ?: [];
    }

    /**
     * Fetches all services along with their parent category data.
     */
    public function getServicesWithCategories(): array {
        global $wpdb;
        return $wpdb->get_results("
            SELECT 
                s.id, 
                s.name, 
                s.description, 
                s.price, 
                s.duration, 
                s.category_id,
                COALESCE(c.name, 'General Services') AS category_name
            FROM {$this->table_name} s
            LEFT JOIN {$this->categories_table} c ON s.category_id = c.id
            WHERE s.is_active = 1 OR s.is_active = 'active'
            ORDER BY c.name ASC, s.name ASC
        ", ARRAY_A) ?: [];
    }

    public function create(array $data): ?int {
        global $wpdb;

        $fields = [
            'name'        => sanitize_text_field($data['name'] ?? ''),
            'slug'        => sanitize_title($data['name'] ?? ''),
            'description' => !empty($data['description']) ? sanitize_textarea_field($data['description']) : null,
            'duration'    => !empty($data['duration']) ? (int)$data['duration'] : 30,
            'price'       => !empty($data['price']) ? (float)$data['price'] : 0.00,
            'category_id' => (int)($data['category_id'] ?? 0),
            'is_active'   => isset($data['is_active']) ? $data['is_active'] : 'active',
            'created_at'  => current_time('mysql'),
            'image_url'   => !empty($data['image_url']) ? esc_url_raw($data['image_url']) : null,
        ];

        $inserted = $wpdb->insert($this->table_name, $fields);
        return $inserted ? $wpdb->insert_id : null;
    }

    public function update(int $id, array $data): bool {
        global $wpdb;

        $fields = ['updated_at' => current_time('mysql')];

        if (isset($data['name'])) {
            $fields['name'] = sanitize_text_field($data['name']);
            $fields['slug'] = sanitize_title($data['name']);
        }
        if (array_key_exists('description', $data)) {
            $fields['description'] = $data['description'] !== null ? sanitize_textarea_field($data['description']) : null;
        }
        if (isset($data['duration'])) {
            $fields['duration'] = (int)$data['duration'];
        }
        if (isset($data['price'])) {
            $fields['price'] = (float)$data['price'];
        }
        if (isset($data['category_id'])) {
            $fields['category_id'] = (int)$data['category_id'];
        }
        if (isset($data['image_url'])) {
            $fields['image_url'] = $data['image_url'] !== null ? esc_url_raw($data['image_url']) : null;
        }
        if (isset($data['is_active'])) {
            $fields['is_active'] = $data['is_active'];
        }

        $result = $wpdb->update($this->table_name, $fields, ['id' => $id]);
        return $result !== false;
    }

    /**
     * Safe baseline delete execution router.
     */
    public function delete(int $id): bool {
        global $wpdb;
        $result = $wpdb->delete($this->table_name, ['id' => $id], ['%d']);
        return $result !== false;
    }
}
