<?php
/**
 * Plugin Name:       EstudoBiblico Quick Format Toolbar
 * Description:       Classic-editor formatting speed for the block editor: underline, strikethrough, superscript, subscript, text color, highlight, lists and more, one click away on the block toolbar.
 * Version:           1.0.1
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            Claudio Crispim
 * Author URI:        https://estudobiblico.org/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       estudobiblico-quick-format-toolbar
 * Domain Path:       /languages
 *
 * @package EstudoBiblicoQuickFormatToolbar
 */

defined( 'ABSPATH' ) || exit;

/**
 * Loads the editor script and styles built into /build.
 * Settings live in the editor (⋮ menu) and are stored per user in core/preferences,
 * so there is no settings page, option or form to secure on the PHP side.
 */
function estudobiblico_quick_format_toolbar_enqueue() {
	$asset_file = __DIR__ . '/build/index.asset.php';
	if ( ! file_exists( $asset_file ) ) {
		return;
	}
	$asset = require $asset_file;

	wp_enqueue_script(
		'estudobiblico-quick-format-toolbar',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version'],
		true
	);
	wp_set_script_translations( 'estudobiblico-quick-format-toolbar', 'estudobiblico-quick-format-toolbar', __DIR__ . '/languages' );

	wp_enqueue_style(
		'estudobiblico-quick-format-toolbar',
		plugins_url( 'build/index.css', __FILE__ ),
		array( 'wp-components' ),
		$asset['version']
	);
	wp_style_add_data( 'estudobiblico-quick-format-toolbar', 'rtl', 'replace' );
}
add_action( 'enqueue_block_editor_assets', 'estudobiblico_quick_format_toolbar_enqueue' );
