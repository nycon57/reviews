<?php
/**
 * RepWell Shortcode — renders widget embed div and enqueues embed.js.
 *
 * Usage: [repwell_widget id="widget-id" width="100%" height="400px" class="my-class"]
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class RepWell_Shortcode {

	/**
	 * Whether embed.js has already been enqueued for the current page.
	 *
	 * @var bool
	 */
	private static $script_enqueued = false;

	/**
	 * Register the shortcode.
	 */
	public static function init() {
		add_shortcode( 'repwell_widget', array( __CLASS__, 'render' ) );
	}

	/**
	 * Shortcode callback.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string HTML output.
	 */
	public static function render( $atts ) {
		$atts = shortcode_atts(
			array(
				'id'     => '',
				'width'  => '',
				'height' => '',
				'class'  => '',
			),
			$atts,
			'repwell_widget'
		);

		$widget_id = sanitize_text_field( $atts['id'] );

		if ( empty( $widget_id ) ) {
			if ( current_user_can( 'edit_posts' ) ) {
				return '<p style="color:#b91c1c;font-weight:600;">' .
					esc_html__( '[RepWell] Missing widget ID. Use: [repwell_widget id="your-widget-id"]', 'repwell-widgets' ) .
					'</p>';
			}
			return '';
		}

		// Enqueue embed.js once per page.
		self::enqueue_embed_script();

		// Build inline styles from optional attributes.
		$styles = array();
		if ( ! empty( $atts['width'] ) ) {
			$styles[] = 'width:' . esc_attr( $atts['width'] );
		}
		if ( ! empty( $atts['height'] ) ) {
			$styles[] = 'min-height:' . esc_attr( $atts['height'] );
		}

		$style_attr = ! empty( $styles ) ? ' style="' . implode( ';', $styles ) . '"' : '';
		$class_attr = ! empty( $atts['class'] ) ? ' class="' . esc_attr( $atts['class'] ) . '"' : '';

		return sprintf(
			'<div data-repwell-widget="%s"%s%s></div>',
			esc_attr( $widget_id ),
			$class_attr,
			$style_attr
		);
	}

	/**
	 * Enqueue embed.js in the footer (once per page).
	 */
	private static function enqueue_embed_script() {
		if ( self::$script_enqueued ) {
			return;
		}

		self::$script_enqueued = true;

		$api_base = RepWell_Settings::get_api_base_url();

		// Build script URL. If API base is set, load embed.js from there;
		// otherwise fall back to a reasonable default.
		$embed_src = ! empty( $api_base )
			? trailingslashit( $api_base ) . 'embed.js'
			: 'https://app.repwell.com/embed.js';

		// Use wp_footer so the script loads after widget divs are in the DOM.
		add_action( 'wp_footer', function () use ( $embed_src, $api_base ) {
			$data_attr = ! empty( $api_base )
				? ' data-api-base="' . esc_attr( $api_base ) . '"'
				: '';

			printf(
				'<script src="%s"%s async></script>' . "\n",
				esc_url( $embed_src ),
				$data_attr
			);
		}, 99 );
	}
}
