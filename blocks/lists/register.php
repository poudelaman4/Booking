<?php
if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'init', 'ignite_register_services_list_block' );

function ignite_register_services_list_block() {
    register_block_type( plugin_dir_path( __FILE__ ) );
}

// Inject wp-dom-ready for editor.js
add_action( 'enqueue_block_editor_assets', 'ignite_services_list_deps', 20 );

function ignite_services_list_deps() {
    global $wp_scripts;
    $handle = generate_block_asset_handle( 'ignite-bookings/services-list', 'editorScript' );
    if ( isset( $wp_scripts->registered[ $handle ] ) ) {
        $wp_scripts->registered[ $handle ]->deps[] = 'wp-dom-ready';
    }
}