<?php
/**
 * Server-side render for the RepWell Widget block.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block inner content (unused).
 * @var WP_Block $block      Block instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$widget_id = isset( $attributes['widgetId'] ) ? sanitize_text_field( $attributes['widgetId'] ) : '';

if ( empty( $widget_id ) ) {
	if ( current_user_can( 'edit_posts' ) ) {
		echo '<p style="color:#b91c1c;font-weight:600;">' .
			esc_html__( '[RepWell] No widget ID configured.', 'repwell-widgets' ) .
			'</p>';
	}
	return;
}

// Build shortcode attributes string and delegate to the shortcode handler
// so embed.js deduplication and enqueuing logic is shared.
$shortcode_atts = 'id="' . esc_attr( $widget_id ) . '"';

if ( ! empty( $attributes['width'] ) ) {
	$shortcode_atts .= ' width="' . esc_attr( $attributes['width'] ) . '"';
}
if ( ! empty( $attributes['height'] ) ) {
	$shortcode_atts .= ' height="' . esc_attr( $attributes['height'] ) . '"';
}
if ( ! empty( $attributes['className'] ) ) {
	$shortcode_atts .= ' class="' . esc_attr( $attributes['className'] ) . '"';
}

echo do_shortcode( '[repwell_widget ' . $shortcode_atts . ']' );
