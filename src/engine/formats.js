/**
 * Inline formats: which ones the toolbar offers and how "clear formatting" works.
 */
import { removeFormat } from '@wordpress/rich-text';

/**
 * Formats that "clear formatting" removes. Links, footnotes, language,
 * math and any third-party format stay untouched, like TinyMCE's
 * removeformat, which never touched <a>.
 */
export const CLEARABLE_FORMATS = [
	'core/bold',
	'core/italic',
	'core/underline',
	'core/strikethrough',
	'core/subscript',
	'core/superscript',
	'core/code',
	'core/keyboard',
	'core/text-color',
];

/** Attributes some formats need when applied (same as their own edit()). */
export const FORMAT_ATTRIBUTES = {
	'core/underline': { style: 'text-decoration: underline;' },
};

/**
 * @param {Object}   value      Rich text value.
 * @param {string[]} registered Names of the registered format types.
 * @return {Object} Value without the known formats in the selection.
 */
export function clearFormatting( value, registered ) {
	return CLEARABLE_FORMATS.filter( ( type ) =>
		registered.includes( type )
	).reduce( ( next, type ) => removeFormat( next, type ), value );
}
