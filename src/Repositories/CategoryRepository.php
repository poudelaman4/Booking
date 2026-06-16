<?php
namespace IgniteBookings\Repositories;

if (!defined('ABSPATH')) exit;

class CategoryRepository {
    private string $table_name;

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'ignite_service_categories';
    }

    public function find(int $id): ?array {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE id = %d LIMIT 1",
            $id
        ), ARRAY_A);
        return $row ?: null;
    }

    /**
     * 🧠 UNIFIED MATRIX LOCK: Securely captures NULL, 0, and explicit string mappings together
     */
    public function findAll(array $args = []): array {
        global $wpdb;
        $where = ["is_active = 1"];
        $params = [];

        if (isset($args['parent_id'])) {
            $parent_id = (int)$args['parent_id'];
            // Handles explicit database NULL entries along with integer fallback blocks seamlessly
            if ($parent_id === 0) {
                $where[] = "(parent_id IS NULL OR parent_id = 0)";
            } else {
                $where[] = "parent_id = %d";
                $params[] = $parent_id;
            }
        }

        $where_clause = implode(" AND ", $where);
        $sql = "SELECT * FROM {$this->table_name} WHERE {$where_clause} ORDER BY id ASC";
        
        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        return $wpdb->get_results($sql, ARRAY_A) ?: [];
    }

    public function save(array $data): ?int {
        global $wpdb;
        
        $fields = [
            'name'        => sanitize_text_field($data['name'] ?? ''),
            'description' => !empty($data['description']) ? sanitize_textarea_field($data['description']) : null
        ];

        // 🌟 STRUCTURAL SAFEGUARD ALIGNED: Only maps to NULL if explicitly omitted on root addition paths
        if (array_key_exists('parent_id', $data)) {
            if ($data['parent_id'] === '' || $data['parent_id'] === null || (int)$data['parent_id'] === 0) {
                $fields['parent_id'] = null;
            } else {
                $fields['parent_id'] = (int)$data['parent_id'];
            }
        }

        if (!empty($data['id'])) {
            $id = (int)$data['id'];
            $fields['updated_at'] = current_time('mysql');
            $result = $wpdb->update($this->table_name, $fields, ['id' => $id]);
            return $result !== false ? $id : null;
        }

        $base_slug = sanitize_title($fields['name']);
        if (empty($base_slug)) { $base_slug = 'category-node'; }
        $slug = $base_slug;
        $counter = 1;
        while (true) {
            $existing_id = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$this->table_name} WHERE slug = %s", $slug));
            if (empty($existing_id)) { break; }
            $slug = $base_slug . '-' . $counter;
            $counter++;
        }
        $fields['slug'] = $slug;
        $fields['is_active'] = 1;
        $fields['created_at'] = current_time('mysql');

        $result = $wpdb->insert($this->table_name, $fields);
        return $result ? $wpdb->insert_id : null;
    }

    public function delete(int $id): bool {
        global $wpdb;
        $result = $wpdb->update($this->table_name, [
            'is_active'  => 0,
            'updated_at' => current_time('mysql')
        ], ['id' => $id]);
        return $result !== false;
    }
}
