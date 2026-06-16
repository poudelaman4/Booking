<?php
/**
 * Plugin Name: Ignite Bookings
 * Version: 1.0.0
 * Description: Premium Amelia-grade custom appointment booking core engine.
 */

if (!defined('ABSPATH')) exit;

// 🚀 Load Composer's Autoloader Matrix
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}
// Inside your main root file (ignite-bookings.php), right below your Composer autoloader check:
if (file_exists(__DIR__ . '/blocks/canvas-builder/register.php')) {
    require_once __DIR__ . '/blocks/canvas-builder/register.php';
}
// Inside your main root file (ignite-bookings.php), right under the canvas-builder layout inclusion line:
if (file_exists(__DIR__ . '/blocks/lists/register.php')) {
    require_once __DIR__ . '/blocks/lists/register.php';
}

// Run the core plugin initializer matrix
add_action('plugins_loaded', function () {
    if (class_exists('\\IgniteBookings\\Core\\Plugin')) {
        $plugin = new \IgniteBookings\Core\Plugin();
        $plugin->init(); // Bootstraps everything cleanly
    }
});

// Connect the physical activation engine hook
// Temporary Troubleshooting Activation Hook
// Airtight Debug Activation Hook
register_activation_hook(__FILE__, function () {
    // Force absolute error rendering overrides
    @ini_set('display_errors', '1');
    @error_reporting(E_ALL);

    // Buffer collection to catch hidden warnings
    ob_start();

    try {
        if (class_exists('\\IgniteBookings\\Core\\Activator')) {
            \IgniteBookings\Core\Activator::activate();
        }
    } catch (\Throwable $e) {
        ob_end_clean();
        wp_die(
            '<h2>🚨 CRITICAL ACTIVATION ERROR CAUGHT:</h2>' .
            '<strong>Message:</strong> ' . esc_html($e->getMessage()) . '<br>' .
            '<strong>File:</strong> ' . esc_html($e->getFile()) . '<br>' .
            '<strong>Line:</strong> ' . absint($e->getLine())
        );
    }

    $unexpected_output = ob_get_clean();

    // If there is hidden text, warnings, or raw syntax output, dump it and kill execution
    if (!empty($unexpected_output)) {
        wp_die(
            '<h2>🔍 SILENT ERROR OUTPUT DETECTED:</h2>' .
            '<pre>' . esc_html($unexpected_output) . '</pre>'
        );
    }
});
