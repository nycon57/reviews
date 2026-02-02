<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Cleans up all RepWell options from the wp_options table.
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'repwell_api_base_url' );
delete_option( 'repwell_api_key' );
