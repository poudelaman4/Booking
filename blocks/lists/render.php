<?php
if ( ! defined( 'ABSPATH' ) ) exit;

global $wpdb;

$categories = $wpdb->get_results(
    "SELECT id, name, parent_id FROM {$wpdb->prefix}ignite_service_categories
     WHERE is_active = 1 ORDER BY name ASC",
    ARRAY_A
);

$services = $wpdb->get_results(
    "SELECT id, name, description, price, duration, category_id FROM {$wpdb->prefix}ignite_services
     WHERE is_active = 1 ORDER BY name ASC",
    ARRAY_A
);

$currency = 'Rs.';
$settings = get_option( 'ignite_settings' );
if ( ! empty( $settings ) ) {
    $settings = is_array( $settings ) ? $settings : json_decode( $settings, true );
    if ( ! empty( $settings['currency_symbol'] ) ) {
        $currency = $settings['currency_symbol'];
    }
}

$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'ignite-nested-catalog-wrapper' ] );
?>

<div <?php echo $wrapper_attributes; ?>>

    <div class="ignite-catalog-header">
        <div>
            <span>Menu Catalog</span>
            <h2>Select a Category</h2>
        </div>
        <button type="button" class="ib-back-btn" style="display:none;">← Back</button>
    </div>

    <?php if ( empty( $categories ) && empty( $services ) ) : ?>
        <div class="ignite-empty-state-box">
            <p>No active services found.</p>
        </div>

    <?php else : ?>

        <div class="ignite-services-grid-mesh">
            <?php foreach ( $categories as $cat ) : ?>
                <div class="ignite-service-treatment-card"
                     data-cat-id="<?php echo (int) $cat['id']; ?>"
                     data-parent-id="<?php echo (int) $cat['parent_id']; ?>"
                     style="display:none; cursor:pointer;">
                    <h3 class="ignite-treatment-title"><?php echo esc_html( $cat['name'] ); ?></h3>
                    <span class="ignite-booking-action-link">Explore →</span>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="ignite-services-grid-mesh">
            <?php foreach ( $services as $srv ) : ?>
                <div class="ignite-service-treatment-card"
                     data-srv-cat-id="<?php echo (int) $srv['category_id']; ?>"
                     style="display:none;">
                    <div class="ignite-card-top-flex">
                        <h4 class="ignite-treatment-title"><?php echo esc_html( $srv['name'] ); ?></h4>
                        <span class="ignite-price-badge">
                            <?php echo esc_html( $currency ) . ' ' . number_format( (float) $srv['price'], 2 ); ?>
                        </span>
                    </div>
                    <?php if ( ! empty( $srv['description'] ) ) : ?>
                        <p class="ignite-treatment-description"><?php echo esc_html( $srv['description'] ); ?></p>
                    <?php endif; ?>
                    <div class="ignite-card-footer-flex">
                        <span class="ignite-duration-tag"><?php echo absint( $srv['duration'] ); ?> mins</span>
                        <span class="ignite-booking-action-link">Book →</span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

    <?php endif; ?>

</div>