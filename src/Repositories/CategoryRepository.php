<?php
namespace IgniteBookings\Repositories;

class CategoryRepository {
    protected $table;

    public function __construct() {
        global $wpdb;
        $this->table = $wpdb->prefix . 'ignite_service_categories';
    }

    public function delete(int $id): bool {
        global $wpdb;
        
        // Since parent_id is self-referential with no direct FK cascade, 
        // we null out children subcategories manually before deleting the parent.
        $wpdb->update($this->table, ['parent_id' => null], ['parent_id' => $id], ['%d'], ['%d']);
        
        // service.category_id is handled by database ON DELETE SET NULL constraint automatically.
        $result = $wpdb->delete($this->table, ['id' => $id], ['%d']);
        return $result !== false && $result > 0;
    }
}
