<?php
/**
 * Removes the plugin's editor preferences when the plugin is deleted.
 *
 * The block editor keeps every user's preferences in one user meta entry,
 * grouped by scope; only this plugin's scope is removed. The editor's own
 * choices, such as "Top toolbar", stay as the user left them.
 *
 * @package QuickFormatToolbar
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Drops the "quick-format-toolbar" scope from the current site's users.
 */
function quick_format_toolbar_forget_preferences() {
	global $wpdb;
	$meta_key = $wpdb->get_blog_prefix() . 'persisted_preferences';
	$user_ids = get_users(
		array(
			'meta_key' => $meta_key, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Runs once, on uninstall.
			'fields'   => 'ID',
			'number'   => -1,
		)
	);
	foreach ( $user_ids as $user_id ) {
		$preferences = get_user_meta( $user_id, $meta_key, true );
		if ( is_array( $preferences ) && isset( $preferences['quick-format-toolbar'] ) ) {
			unset( $preferences['quick-format-toolbar'] );
			update_user_meta( $user_id, $meta_key, $preferences );
		}
	}
}

if ( is_multisite() ) {
	foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $quick_format_toolbar_site_id ) {
		switch_to_blog( $quick_format_toolbar_site_id );
		quick_format_toolbar_forget_preferences();
		restore_current_blog();
	}
} else {
	quick_format_toolbar_forget_preferences();
}
