/**
 * A "target" is what the toolbar formats: either the focused rich text
 * (value/onChange handed to format types by RichText itself), or text
 * selected across several blocks (edited through block attributes).
 * Both expose the same small interface so every control works on either.
 */
import {
	applyFormat,
	create,
	getActiveFormat,
	getActiveFormats,
	insert,
	removeFormat,
	toggleFormat,
	toHTMLString,
	RichTextData,
} from '@wordpress/rich-text';
import { getBlockType } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

import { setColors, getActiveColors } from './colors';
import { clearFormatting, FORMAT_ATTRIBUTES } from './formats';

/**
 * The focused rich text. `read` returns its latest { value, onChange }, so one
 * target object serves every keystroke and the toolbar does not re-render on each.
 *
 * @param {Function} read               Returns { value, onChange }.
 * @param {Object}   context            Shared settings.
 * @param {Array}    context.palette    Theme palette.
 * @param {string[]} context.registered Registered format names.
 * @return {Object} Target.
 */
export function createSingleTarget( read, { palette, registered } ) {
	const change = ( transform ) => {
		const { value, onChange } = read();
		onChange( transform( value ) );
	};
	return {
		isMulti: false,
		isActive: ( type ) => !! getActiveFormat( read().value, type ),
		activeColors: () => getActiveColors( read().value, palette ),
		toggle: ( type ) =>
			change( ( value ) =>
				toggleFormat( value, {
					type,
					attributes: FORMAT_ATTRIBUTES[ type ],
				} )
			),
		setColors: ( patch ) =>
			change( ( value ) => setColors( value, palette, patch ) ),
		clear: () =>
			change( ( value ) => clearFormatting( value, registered ) ),
		canInsert: true,
		insert: ( text ) => change( ( value ) => insert( value, text ) ),
	};
}

/**
 * What the toolbar shows about a rich text value: the formats (and colors)
 * active at the selection. Typing plain text does not change it.
 *
 * @param {Object} value Rich text value.
 * @return {string} Signature.
 */
export function formatSignature( value ) {
	return getActiveFormats( value )
		.map(
			( format ) =>
				format.type +
				( format.attributes ? JSON.stringify( format.attributes ) : '' )
		)
		.join( '|' );
}

/**
 * The rich text attributes of a block. Only attributes declared as rich text
 * count: `source: "html"` also covers legacy or structural markup (core/list
 * "values", core/quote "value", core/math "mathML" in Gutenberg 24), which must
 * not be formatted.
 *
 * @param {string} blockName Block name.
 * @return {string[]} Attribute keys.
 */
function richTextKeys( blockName ) {
	const attributes = getBlockType( blockName )?.attributes || {};
	return Object.keys( attributes ).filter(
		( key ) =>
			attributes[ key ].type === 'rich-text' ||
			attributes[ key ].source === 'rich-text'
	);
}

/**
 * Which field of a block the selection is in. The editor names it at the
 * selection's own edges; in between, only a block with a single rich text
 * field is unambiguous. A block with several of them (core/pullquote's value
 * and citation, core/file, captions) is left alone rather than guessed at.
 *
 * @param {string}      blockName Block name.
 * @param {string|null} edgeKey   Attribute named by the selection edge, if any.
 * @return {string|null} Attribute key, or null when it cannot be told.
 */
function selectedKey( blockName, edgeKey ) {
	const keys = richTextKeys( blockName );
	if ( edgeKey && keys.includes( edgeKey ) ) {
		return edgeKey;
	}
	return keys.length === 1 ? keys[ 0 ] : null;
}

/**
 * One rich text value per selected block, each with its own part of the selection.
 *
 * @param {Object} registry Data registry.
 * @return {Array<{clientId: string, key: string, value: Object}>} Values to edit.
 */
export function getMultiSelectionValues( registry ) {
	const editor = registry.select( blockEditorStore );
	if ( editor.getMultiSelectedBlockClientIds().length < 2 ) {
		return [];
	}
	// A selection can be dragged either way, so the editor's two ends are the
	// gesture's: the one it started at and the one it ended at, in that order.
	// What is formatted is what the user sees selected, so both ends are put
	// back in the order the blocks are read in, top to bottom.
	const anchor = editor.getSelectionStart();
	const focus = editor.getSelectionEnd();
	if ( ! anchor?.clientId || ! focus?.clientId ) {
		return [];
	}
	// The editor only selects across blocks that are siblings. Anything else
	// is not something to make assumptions about.
	const root = editor.getBlockRootClientId( anchor.clientId );
	if ( root !== editor.getBlockRootClientId( focus.clientId ) ) {
		return [];
	}
	const order = editor.getBlockOrder( root ) || [];
	const anchorIndex = order.indexOf( anchor.clientId );
	const focusIndex = order.indexOf( focus.clientId );
	if ( anchorIndex < 0 || focusIndex < 0 ) {
		return [];
	}
	const [ documentStart, documentEnd ] =
		anchorIndex <= focusIndex ? [ anchor, focus ] : [ focus, anchor ];
	const selected = order.slice(
		Math.min( anchorIndex, focusIndex ),
		Math.max( anchorIndex, focusIndex ) + 1
	);
	const hasOffset = ( edge ) => typeof edge?.offset === 'number';

	// The first block is selected from an offset to its end, the last one from
	// its beginning to an offset, and everything in between as a whole.
	return selected
		.map( ( clientId, index ) => {
			const block = editor.getBlock( clientId );
			const isFirst = clientId === documentStart.clientId;
			const isLast = clientId === documentEnd.clientId;
			const edge =
				( isFirst && documentStart ) || ( isLast && documentEnd );
			const key = selectedKey( block?.name, edge?.attributeKey );
			if ( ! block || ! key || block.attributes[ key ] === undefined ) {
				return null;
			}
			const value = create( { html: String( block.attributes[ key ] ) } );
			const start =
				index === 0 && hasOffset( documentStart )
					? documentStart.offset
					: 0;
			const end =
				index === selected.length - 1 && hasOffset( documentEnd )
					? documentEnd.offset
					: value.text.length;
			return { clientId, key, value: { ...value, start, end } };
		} )
		.filter( ( item ) => item && item.value.start < item.value.end );
}

/**
 * @param {Object}   registry           Data registry.
 * @param {Object}   context            Shared settings.
 * @param {Array}    context.palette    Theme palette.
 * @param {string[]} context.registered Registered format names.
 * @return {Object|null} Target, or null when there is no text to format.
 */
export function createMultiTarget( registry, { palette, registered } ) {
	const items = getMultiSelectionValues( registry );
	if ( ! items.length ) {
		return null;
	}
	const save = ( change ) => {
		const attributes = {};
		items.forEach( ( { clientId, key, value } ) => {
			const html = toHTMLString( { value: change( value ) } );
			attributes[ clientId ] = {
				[ key ]: RichTextData?.fromHTMLString
					? RichTextData.fromHTMLString( html )
					: html,
			};
		} );
		// A single call, so a single undo step reverts every block.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes(
				Object.keys( attributes ),
				attributes,
				true
			);
	};
	const first = items[ 0 ].value;

	return {
		isMulti: true,

		isActive: ( type ) => !! getActiveFormat( first, type ),
		activeColors: () => getActiveColors( first, palette ),
		// Across blocks, the first block decides whether the format goes on or off everywhere.
		toggle: ( type ) => {
			const format = { type, attributes: FORMAT_ATTRIBUTES[ type ] };
			const turnOff = !! getActiveFormat( first, type );
			save( ( value ) =>
				turnOff
					? removeFormat( value, type )
					: applyFormat( value, format )
			);
		},
		setColors: ( patch ) =>
			save( ( value ) => setColors( value, palette, patch ) ),
		clear: () => save( ( value ) => clearFormatting( value, registered ) ),
		canInsert: false,
		insert: () => {},
	};
}
