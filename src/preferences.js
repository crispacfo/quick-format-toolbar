/**
 * User preferences, stored per user in core/preferences (the editor's own store).
 */
import { store as preferencesStore } from '@wordpress/preferences';
import { useDispatch, useSelect, dispatch } from '@wordpress/data';

export const SCOPE = 'quick-format-toolbar';

export const INSPECTOR_CONTROLS = [
	'padding',
	'margin',
	'blockGap',
	'lineHeight',
	'border',
	'radius',
];

export const DEFAULTS = {
	// Inline tools the editor hides; block tools and extras are opt-in.
	tools: [
		'underline',
		'strikethrough',
		'textColor',
		'highlight',
		'superscript',
		'subscript',
		'clearFormatting',
	],
	density: 'normal',
	textColor: '#cf2e2e',
	highlightColor: '#fcb900',
	// Experimental, off by default: relies on __experimentalDefaultControls.
	inspectorEnabled: false,
	inspectorShortcuts: [ 'padding', 'margin', 'lineHeight', 'border' ],
};

/** Button width per density: the editor's toolbar sets the height. */
export const DENSITIES = { compact: 28, normal: 32, comfortable: 36 };

export function registerDefaults() {
	const actions = dispatch( preferencesStore );
	if ( actions && typeof actions.setDefaults === 'function' ) {
		actions.setDefaults( SCOPE, DEFAULTS );
	}
}

/**
 * @param {string} name Preference name.
 * @return {[*, Function]} Current value and setter.
 */
export function usePreference( name ) {
	const value = useSelect(
		( select ) => select( preferencesStore ).get( SCOPE, name ),
		[ name ]
	);
	const { set } = useDispatch( preferencesStore );
	return [ value ?? DEFAULTS[ name ], ( next ) => set( SCOPE, name, next ) ];
}
