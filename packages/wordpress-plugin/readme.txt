=== RepWell Widgets ===
Contributors: repwell
Tags: reviews, widgets, testimonials, nps, social proof
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed RepWell review widgets on your WordPress site using shortcodes or the Gutenberg block editor.

== Description ==

RepWell Widgets lets you display review widgets, star ratings, testimonials, NPS badges, and more on any WordPress page or post.

**Features:**

* Shortcode support: `[repwell_widget id="your-widget-id"]`
* Gutenberg block with live preview in the editor
* Classic Editor toolbar button for easy shortcode insertion
* Configurable width, height, and CSS class per widget
* embed.js loaded once per page regardless of the number of widgets
* Compatible with popular themes (Twenty Twenty-Four, Divi, Elementor)
* No conflicts with Yoast SEO, WooCommerce, or Elementor

== Installation ==

1. Download the plugin zip file.
2. In your WordPress admin, go to **Plugins > Add New > Upload Plugin**.
3. Upload the zip file and click **Install Now**.
4. Activate the plugin.
5. Go to **Settings > RepWell Widgets** and enter your API Base URL.

== Usage ==

**Shortcode:**

`[repwell_widget id="your-widget-id"]`

**Optional attributes:**

* `width` — Container width (e.g., `"600px"` or `"100%"`)
* `height` — Container min-height (e.g., `"400px"`)
* `class` — Additional CSS class names

**Gutenberg Block:**

1. Add a new block and search for "RepWell Widget".
2. Enter the Widget ID in the block settings panel.
3. A live preview will appear in the editor.

**Classic Editor:**

1. Click the star icon in the toolbar.
2. Enter the Widget ID in the dialog.
3. The shortcode will be inserted into your content.

== Frequently Asked Questions ==

= Where do I find my Widget ID? =

Log in to your RepWell dashboard, go to the Widgets section, and copy the widget ID from the embed code or widget settings.

= Does the plugin work with page builders? =

Yes. The shortcode works inside Elementor text widgets, Divi text modules, and any builder that supports WordPress shortcodes.

= Can I add multiple widgets to one page? =

Yes. Use multiple shortcodes or blocks. The embed script is loaded only once per page.

= What PHP and WordPress versions are required? =

PHP 7.4 or later and WordPress 6.0 or later.

== Changelog ==

= 1.0.0 =
* Initial release.
* Shortcode support with width, height, and class attributes.
* Gutenberg block with ServerSideRender preview.
* Classic Editor TinyMCE button.
* Settings page for API Base URL and API Key.
* Uninstall hook for clean removal.
