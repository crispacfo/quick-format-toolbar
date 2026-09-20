/**
 * Inspector Shortcuts (optional, isolated): show chosen sidebar controls
 * without going through the "+" menu, by marking them as default controls.
 *
 * This relies on the experimental `__experimentalDefaultControls` block support.
 * It is kept apart from the toolbar on purpose: if the editor drops or renames
 * that key, the controls simply go back behind "+", and nothing else changes.
 */
import { addFilter } from '@wordpress/hooks';
import { select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

import { DEFAULTS, SCOPE } from './preferences';

const DEFAULT_CONTROLS_KEY = '__experimentalDefaultControls';

/** [ support group, support feature, default-controls key ] for each option. */
const MAP = {
	padding: [ [ 'spacing', 'padding', 'padding' ] ],
	margin: [ [ 'spacing', 'margin', 'margin' ] ],
	blockGap: [ [ 'spacing', 'blockGap', 'blockGap' ] ],
	lineHeight: [ [ 'typography', 'lineHeight', 'lineHeight' ] ],
	border: [
		[ '__experimentalBorder', 'color', 'color' ],
		[ '__experimentalBorder', 'width', 'width' ],
		[ 'border', 'color', 'color' ],
		[ 'border', 'width', 'width' ],
	],
	radius: [
		[ '__experimentalBorder', 'radius', 'radius' ],
		[ 'border', 'radius', 'radius' ],
	],
};

// Off unless the user turned the experimental module on.
function chosenControls() {
	try {
		const preferences = select( preferencesStore );
		const enabled =
			preferences.get( SCOPE, 'inspectorEnabled' ) ??
			DEFAULTS.inspectorEnabled;
		if ( ! enabled ) {
			return [];
		}
		return (
			preferences.get( SCOPE, 'inspectorShortcuts' ) ??
			DEFAULTS.inspectorShortcuts
		);
	} catch {
		return [];
	}
}

export function openDefaultControls( settings ) {
	try {
		const chosen = chosenControls();
		if ( ! chosen.length || ! settings?.supports ) {
			return settings;
		}
		const supports = { ...settings.supports };
		chosen.forEach( ( option ) => {
			( MAP[ option ] || [] ).forEach( ( [ group, feature, key ] ) => {
				const support = supports[ group ];
				// Only blocks that support the feature, declared as an object.
				if (
					! support ||
					typeof support !== 'object' ||
					! support[ feature ]
				) {
					return;
				}
				supports[ group ] = {
					...support,
					[ DEFAULT_CONTROLS_KEY ]: {
						...support[ DEFAULT_CONTROLS_KEY ],
						[ key ]: true,
					},
				};
			} );
		} );
		return { ...settings, supports };
	} catch {
		// Never break block registration over a convenience.
		return settings;
	}
}

export function registerInspectorShortcuts() {
	addFilter(
		'blocks.registerBlockType',
		'quick-format-toolbar/inspector-shortcuts',
		openDefaultControls
	);
}
