/**
 * Quick Format Toolbar — entry point.
 * Each part registers on its own: if one fails on some editor version, the
 * others keep working and the editor itself is never affected.
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import * as editor from '@wordpress/editor';
import { formatUnderline } from '@wordpress/icons';

import { registerDefaults } from './preferences';
import { registerControllers } from './controllers';
import { registerInspectorShortcuts } from './inspector-shortcuts';
import SettingsModal from './settings/SettingsModal';
import './editor.scss';

function safely( label, callback ) {
	try {
		callback();
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn( `Quick Format Toolbar: ${ label } unavailable.`, error );
	}
}

// @wordpress/editor has the menu slot since WordPress 6.6; edit-post had it before.
const MoreMenuItem =
	editor.PluginMoreMenuItem || window.wp?.editPost?.PluginMoreMenuItem;

function SettingsMenu() {
	const [ isOpen, setIsOpen ] = useState( false );
	if ( ! MoreMenuItem ) {
		return null;
	}
	return (
		<>
			<MoreMenuItem
				icon={ formatUnderline }
				onClick={ () => setIsOpen( true ) }
			>
				{ __( 'Quick Format Toolbar', 'quick-format-toolbar' ) }
			</MoreMenuItem>
			{ isOpen && <SettingsModal onClose={ () => setIsOpen( false ) } /> }
		</>
	);
}

safely( 'preferences', registerDefaults );
safely( 'inspector shortcuts', registerInspectorShortcuts );
safely( 'toolbar', registerControllers );
safely( 'settings', () =>
	registerPlugin( 'quick-format-toolbar', { render: SettingsMenu } )
);
