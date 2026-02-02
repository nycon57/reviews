<?php
/**
 * RepWell Settings — WP Admin settings page for plugin configuration.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class RepWell_Settings {

	const OPTION_API_BASE = 'repwell_api_base_url';
	const OPTION_API_KEY  = 'repwell_api_key';
	const PAGE_SLUG       = 'repwell-widgets';
	const SETTINGS_GROUP  = 'repwell_widgets_settings';

	/**
	 * Hook into WordPress.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_menu_page' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	/**
	 * Add menu page under Settings.
	 */
	public static function add_menu_page() {
		add_options_page(
			__( 'RepWell Widgets', 'repwell-widgets' ),
			__( 'RepWell Widgets', 'repwell-widgets' ),
			'manage_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_settings_page' )
		);
	}

	/**
	 * Register settings fields.
	 */
	public static function register_settings() {
		register_setting( self::SETTINGS_GROUP, self::OPTION_API_BASE, array(
			'type'              => 'string',
			'sanitize_callback' => 'esc_url_raw',
			'default'           => '',
		) );

		register_setting( self::SETTINGS_GROUP, self::OPTION_API_KEY, array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		) );

		add_settings_section(
			'repwell_main_section',
			__( 'Connection Settings', 'repwell-widgets' ),
			array( __CLASS__, 'render_section_description' ),
			self::PAGE_SLUG
		);

		add_settings_field(
			self::OPTION_API_BASE,
			__( 'API Base URL', 'repwell-widgets' ),
			array( __CLASS__, 'render_api_base_field' ),
			self::PAGE_SLUG,
			'repwell_main_section'
		);

		add_settings_field(
			self::OPTION_API_KEY,
			__( 'API Key (optional)', 'repwell-widgets' ),
			array( __CLASS__, 'render_api_key_field' ),
			self::PAGE_SLUG,
			'repwell_main_section'
		);
	}

	/**
	 * Section description.
	 */
	public static function render_section_description() {
		echo '<p>' . esc_html__( 'Enter your RepWell instance URL to connect widgets to your account.', 'repwell-widgets' ) . '</p>';
	}

	/**
	 * API Base URL field.
	 */
	public static function render_api_base_field() {
		$value = get_option( self::OPTION_API_BASE, '' );
		printf(
			'<input type="url" id="%1$s" name="%1$s" value="%2$s" class="regular-text" placeholder="https://app.repwell.com" />',
			esc_attr( self::OPTION_API_BASE ),
			esc_attr( $value )
		);
		echo '<p class="description">' . esc_html__( 'The base URL of your RepWell instance (e.g., https://app.repwell.com).', 'repwell-widgets' ) . '</p>';
	}

	/**
	 * API Key field.
	 */
	public static function render_api_key_field() {
		$value = get_option( self::OPTION_API_KEY, '' );
		printf(
			'<input type="text" id="%1$s" name="%1$s" value="%2$s" class="regular-text" placeholder="" />',
			esc_attr( self::OPTION_API_KEY ),
			esc_attr( $value )
		);
		echo '<p class="description">' . esc_html__( 'Optional API key for authenticated access.', 'repwell-widgets' ) . '</p>';
	}

	/**
	 * Render settings page.
	 */
	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( self::SETTINGS_GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button( __( 'Save Settings', 'repwell-widgets' ) );
				?>
			</form>

			<hr />

			<h2><?php esc_html_e( 'Usage', 'repwell-widgets' ); ?></h2>
			<p><?php esc_html_e( 'Add a widget to any page or post using the shortcode:', 'repwell-widgets' ); ?></p>
			<pre><code>[repwell_widget id="your-widget-id"]</code></pre>

			<p><?php esc_html_e( 'Optional attributes:', 'repwell-widgets' ); ?></p>
			<ul>
				<li><code>width</code> &mdash; <?php esc_html_e( 'Container width (e.g., "600px" or "100%")', 'repwell-widgets' ); ?></li>
				<li><code>height</code> &mdash; <?php esc_html_e( 'Container min-height (e.g., "400px")', 'repwell-widgets' ); ?></li>
				<li><code>class</code> &mdash; <?php esc_html_e( 'Additional CSS class names', 'repwell-widgets' ); ?></li>
			</ul>
		</div>
		<?php
	}

	/**
	 * Get the configured API base URL.
	 *
	 * @return string
	 */
	public static function get_api_base_url() {
		return get_option( self::OPTION_API_BASE, '' );
	}

	/**
	 * Get the configured API key.
	 *
	 * @return string
	 */
	public static function get_api_key() {
		return get_option( self::OPTION_API_KEY, '' );
	}

}
