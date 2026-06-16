<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'init', 'ignite_register_editable_container' );

function ignite_register_editable_container() {
    register_block_type( plugin_dir_path( __FILE__ ) );
}

// Inject wp-dom-ready as a dependency since block.json can't declare it.
add_action( 'enqueue_block_editor_assets', 'ignite_editable_container_deps', 20 );

function ignite_editable_container_deps() {
    global $wp_scripts;
    $handle = generate_block_asset_handle( 'ignite-bookings/editable-container', 'editorScript' );
    if ( isset( $wp_scripts->registered[ $handle ] ) ) {
        $wp_scripts->registered[ $handle ]->deps[] = 'wp-dom-ready';
    }
}