<?php
/**
 * Plugin Name: RepWell Widgets
 * Plugin URI:  https://repwell.com/integrations/wordpress
 * Description: Embed RepWell review widgets on your WordPress site via shortcodes or the Gutenberg block editor.
 * Version:     1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author:      RepWell
 * Author URI:  https://repwell.com
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: repwell-widgets
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'REPWELL_WIDGETS_VERSION', '1.0.0' );
define( 'REPWELL_WIDGETS_FILE', __FILE__ );
define( 'REPWELL_WIDGETS_DIR', plugin_dir_path( __FILE__ ) );
define( 'REPWELL_WIDGETS_URL', plugin_dir_url( __FILE__ ) );

// Load plugin classes.
require_once REPWELL_WIDGETS_DIR . 'includes/class-repwell-settings.php';
require_once REPWELL_WIDGETS_DIR . 'includes/class-repwell-shortcode.php';

/**
 * Initialize the plugin on plugins_loaded so translations and
 * other plugins are available.
 */
function repwell_widgets_init() {
	RepWell_Settings::init();
	RepWell_Shortcode::init();

	// Register Gutenberg block if the block editor is available.
	if ( function_exists( 'register_block_type' ) ) {
		add_action( 'init', 'repwell_register_block' );
	}

	// Classic Editor: TinyMCE button.
	add_action( 'admin_init', 'repwell_register_tinymce_plugin' );
}
add_action( 'plugins_loaded', 'repwell_widgets_init' );

/**
 * Register the Gutenberg block.
 */
function repwell_register_block() {
	$asset_file = REPWELL_WIDGETS_DIR . 'blocks/repwell-widget/index.asset.php';
	$asset      = file_exists( $asset_file )
		? require $asset_file
		: array(
			'dependencies' => array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render' ),
			'version'      => REPWELL_WIDGETS_VERSION,
		);

	wp_register_script(
		'repwell-widget-block',
		REPWELL_WIDGETS_URL . 'blocks/repwell-widget/index.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	register_block_type( REPWELL_WIDGETS_DIR . 'blocks/repwell-widget' );
}

/**
 * Register the TinyMCE plugin for the Classic Editor.
 */
function repwell_register_tinymce_plugin() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	add_filter( 'mce_buttons', 'repwell_add_tinymce_button' );
	add_filter( 'mce_external_plugins', 'repwell_add_tinymce_plugin_script' );
}

/**
 * Add the RepWell button to the TinyMCE toolbar.
 *
 * @param array $buttons Existing buttons.
 * @return array
 */
function repwell_add_tinymce_button( $buttons ) {
	$buttons[] = 'repwell_insert_widget';
	return $buttons;
}

/**
 * Register the TinyMCE plugin JS.
 *
 * @param array $plugins Existing plugins.
 * @return array
 */
function repwell_add_tinymce_plugin_script( $plugins ) {
	$plugins['repwell_insert_widget'] = REPWELL_WIDGETS_URL . 'assets/js/tinymce-plugin.js';
	return $plugins;
}
