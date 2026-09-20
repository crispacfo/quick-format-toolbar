/**
 * The tool catalog, in toolbar order. Bold, italic and link are not here on
 * purpose: the editor's own toolbar already shows them, one click away. The
 * plugin adds what the editor keeps behind "More" or does not show at all.
 */
import { __ } from '@wordpress/i18n';
import {
	code,
	formatListBullets,
	formatListNumbered,
	formatStrikethrough,
	formatUnderline,
	quote,
	subscript,
	superscript,
} from '@wordpress/icons';

import { clearFormattingIcon, specialCharactersIcon } from './icons';

/**
 * group:   "inline" goes after the editor's bold / italic / link;
 *          "block" goes with the block's own controls.
 * section: tools of one section form one visual group (ToolbarGroup).
 * kind:    how the tool renders and acts.
 */
export const TOOLS = {
	underline: {
		group: 'inline',
		section: 'emphasis',
		kind: 'format',
		format: 'core/underline',
		icon: formatUnderline,
		label: __( 'Underline', 'quick-format-toolbar' ),
	},
	strikethrough: {
		group: 'inline',
		section: 'emphasis',
		kind: 'format',
		format: 'core/strikethrough',
		icon: formatStrikethrough,
		label: __( 'Strikethrough', 'quick-format-toolbar' ),
	},
	textColor: {
		group: 'inline',
		section: 'color',
		kind: 'split',
		property: 'color',
		label: __( 'Text color', 'quick-format-toolbar' ),
	},
	highlight: {
		group: 'inline',
		section: 'color',
		kind: 'split',
		property: 'backgroundColor',
		label: __( 'Highlight', 'quick-format-toolbar' ),
	},
	superscript: {
		group: 'inline',
		section: 'script',
		kind: 'format',
		format: 'core/superscript',
		icon: superscript,
		label: __( 'Superscript', 'quick-format-toolbar' ),
	},
	subscript: {
		group: 'inline',
		section: 'script',
		kind: 'format',
		format: 'core/subscript',
		icon: subscript,
		label: __( 'Subscript', 'quick-format-toolbar' ),
	},
	clearFormatting: {
		group: 'inline',
		section: 'clear',
		kind: 'clear',
		icon: clearFormattingIcon,
		label: __( 'Clear formatting', 'quick-format-toolbar' ),
	},
	code: {
		group: 'inline',
		section: 'extra',
		kind: 'format',
		format: 'core/code',
		icon: code,
		label: __( 'Inline code', 'quick-format-toolbar' ),
	},
	specialCharacters: {
		group: 'inline',
		section: 'chars',
		kind: 'chars',
		icon: specialCharactersIcon,
		label: __( 'Special characters', 'quick-format-toolbar' ),
	},
	blockType: {
		group: 'block',
		section: 'block',
		kind: 'blockType',
		label: __( 'Paragraph and headings', 'quick-format-toolbar' ),
	},
	bulletList: {
		group: 'block',
		section: 'block',
		kind: 'list',
		ordered: false,
		icon: formatListBullets,
		label: __( 'Bulleted list', 'quick-format-toolbar' ),
	},
	numberedList: {
		group: 'block',
		section: 'block',
		kind: 'list',
		ordered: true,
		icon: formatListNumbered,
		label: __( 'Numbered list', 'quick-format-toolbar' ),
	},
	quote: {
		group: 'block',
		section: 'block',
		kind: 'quote',
		icon: quote,
		label: __( 'Quote', 'quick-format-toolbar' ),
	},
	alignment: {
		group: 'block',
		section: 'align',
		kind: 'alignment',
		label: __( 'Text alignment', 'quick-format-toolbar' ),
	},
};

/** Catalog order is toolbar order. */
export const TOOL_ORDER = Object.keys( TOOLS );

/** Sections that fold into the "More formatting" menu when space runs out. */
export const FOLDABLE_SECTIONS = [ 'script', 'clear', 'extra' ];

export const SPECIAL_CHARACTERS = (
	'— – … © ® ™ ° ± × ÷ “ ” ‘ ’ « » „ § ¶ † ‡ • · ½ ¼ ' +
	'¾ ¹ ² ³ → ← ↔ á é í ó ú ç ã õ α β γ δ θ λ π Ω א ב'
).split( ' ' );

/**
 * Whether a tool applies to the current context.
 *
 * @param {Object}   tool               Tool definition.
 * @param {Object}   context            Current context.
 * @param {Object}   context.target     Formatting target.
 * @param {Object}   context.blockState Selected block state.
 * @param {string[]} context.registered Registered format names.
 * @param {boolean}  context.hasColors  Whether any color may be applied.
 * @return {boolean} Shown or not.
 */
export function isAvailable(
	tool,
	{ target, blockState, registered, hasColors }
) {
	switch ( tool.kind ) {
		case 'format':
			return registered.includes( tool.format );
		case 'split':
			// A theme with no palette and no custom colors allows no color at all.
			return registered.includes( 'core/text-color' ) && hasColors;
		case 'chars':
			return target.canInsert;
		case 'alignment':
			return !! blockState.alignable;
		case 'blockType':
		case 'list':
		case 'quote':
			return !! blockState.name;
		default:
			return true;
	}
}
