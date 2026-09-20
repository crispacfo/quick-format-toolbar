/**
 * Which part of each block a selection across several blocks covers.
 *
 * A selection can be made downwards or upwards, and the editor reports its two
 * ends in the order the gesture was made. What must never change is the text
 * that gets formatted: it is the text the user sees selected. So every case
 * here is run both ways, and the two results have to be the same.
 */
jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
	getColorClassName: ( context, slug ) => `has-${ slug }-${ context }`,
	getColorObjectByColorValue: () => undefined,
	getColorObjectByAttributeValues: () => ( {} ),
} ) );

jest.mock( '@wordpress/blocks', () => {
	const types = {
		'core/paragraph': { content: { type: 'rich-text' } },
		'core/heading': { content: { type: 'rich-text' } },
		'core/list-item': { content: { type: 'rich-text' } },
		// Two rich text fields: which one is selected cannot be guessed.
		'core/pullquote': {
			value: { type: 'rich-text' },
			citation: { type: 'rich-text' },
		},
		// source: "html" is markup, not an editable rich text field.
		'core/list': { values: { source: 'html' } },
	};
	return { getBlockType: ( name ) => ( { attributes: types[ name ] } ) };
} );

import { registerFormatType } from '@wordpress/rich-text';

import { createMultiTarget, getMultiSelectionValues } from '../engine/targets';

beforeAll( () => {
	registerFormatType( 'core/underline', {
		title: 'core/underline',
		tagName: 'span',
		className: null,
		attributes: { style: 'style' },
		edit: () => null,
	} );
} );

/**
 * A stand-in for the editor's store.
 *
 * Blocks are given in document order, as [ name, attributes ] or, for nested
 * ones, [ name, attributes, root ]. Selection ends are { block, offset } and
 * optionally an attributeKey, in the order the gesture made them.
 *
 * @param {Array}  blocks Blocks, in document order.
 * @param {Object} anchor Where the selection started.
 * @param {Object} focus  Where it ended.
 * @return {Object} Registry double, with the calls it received in `dispatched`.
 */
function editorWith( blocks, anchor, focus ) {
	const all = blocks.map( ( [ name, attributes, root = '' ], index ) => ( {
		clientId: String.fromCharCode( 65 + index ),
		name,
		attributes,
		root,
	} ) );
	const end = ( { block, offset, attributeKey = 'content' } ) => ( {
		clientId: all[ block ].clientId,
		attributeKey,
		offset,
	} );
	const dispatched = [];
	const editor = {
		getMultiSelectedBlockClientIds: () =>
			all
				.filter( ( block ) => block.root === all[ anchor.block ].root )
				.map( ( block ) => block.clientId ),
		getSelectionStart: () => end( anchor ),
		getSelectionEnd: () => end( focus ),
		getBlock: ( clientId ) =>
			all.find( ( block ) => block.clientId === clientId ),
		getBlockRootClientId: ( clientId ) =>
			all.find( ( block ) => block.clientId === clientId )?.root,
		getBlockOrder: ( root ) =>
			all
				.filter( ( block ) => block.root === ( root || '' ) )
				.map( ( block ) => block.clientId ),
	};
	return {
		dispatched,
		select: () => editor,
		dispatch: () => ( {
			updateBlockAttributes: ( ...args ) => dispatched.push( args ),
		} ),
	};
}

/**
 * @param {Array} items Values to edit.
 * @return {Array} { clientId, key, start, end } per edited field.
 */
const ranges = ( items ) =>
	items.map( ( { clientId, key, value } ) => ( {
		clientId,
		key,
		start: value.start,
		end: value.end,
	} ) );

/**
 * The same visual selection, dragged down and dragged up.
 *
 * @param {Array}  blocks Blocks, in document order.
 * @param {Object} top    The end in the block that comes first.
 * @param {Object} bottom The end in the block that comes last.
 * @return {Object} { forward, reverse } ranges.
 */
function bothWays( blocks, top, bottom ) {
	return {
		forward: ranges(
			getMultiSelectionValues( editorWith( blocks, top, bottom ) )
		),
		reverse: ranges(
			getMultiSelectionValues( editorWith( blocks, bottom, top ) )
		),
	};
}

const paragraphs = ( ...texts ) =>
	texts.map( ( text ) => [ 'core/paragraph', { content: text } ] );

const TWO = paragraphs( 'ABCDEFGHIJ', 'KLMNOPQRST' );
const THREE = paragraphs( 'AAAAAAAAAA', 'BBBBBBBBBB', 'CCCCCCCCCC' );

describe( 'two blocks', () => {
	// ABCDE[FGHIJ / KLMNO]PQRST
	const expected = [
		{ clientId: 'A', key: 'content', start: 5, end: 10 },
		{ clientId: 'B', key: 'content', start: 0, end: 5 },
	];
	const { forward, reverse } = bothWays(
		TWO,
		{ block: 0, offset: 5 },
		{ block: 1, offset: 5 }
	);

	it( 'formats the selected text, dragged downwards', () => {
		expect( forward ).toEqual( expected );
	} );

	it( 'formats the selected text, dragged upwards', () => {
		expect( reverse ).toEqual( expected );
	} );

	it( 'gives the same result either way', () => {
		expect( reverse ).toEqual( forward );
	} );
} );

describe( 'three blocks', () => {
	const expected = [
		{ clientId: 'A', key: 'content', start: 3, end: 10 },
		{ clientId: 'B', key: 'content', start: 0, end: 10 },
		{ clientId: 'C', key: 'content', start: 0, end: 7 },
	];
	const { forward, reverse } = bothWays(
		THREE,
		{ block: 0, offset: 3 },
		{ block: 2, offset: 7 }
	);

	it( 'covers the block in between as a whole, dragged downwards', () => {
		expect( forward ).toEqual( expected );
	} );

	it( 'covers the block in between as a whole, dragged upwards', () => {
		expect( reverse ).toEqual( expected );
	} );

	it( 'gives the same result either way', () => {
		expect( reverse ).toEqual( forward );
	} );
} );

describe( 'selections that end at a block edge', () => {
	it( 'takes both blocks whole, from offset 0 to the last character', () => {
		const { forward, reverse } = bothWays(
			TWO,
			{ block: 0, offset: 0 },
			{ block: 1, offset: 10 }
		);
		expect( forward ).toEqual( [
			{ clientId: 'A', key: 'content', start: 0, end: 10 },
			{ clientId: 'B', key: 'content', start: 0, end: 10 },
		] );
		expect( reverse ).toEqual( forward );
	} );

	it( 'leaves out a block whose selected part is empty', () => {
		const { forward, reverse } = bothWays(
			TWO,
			{ block: 0, offset: 5 },
			{ block: 1, offset: 0 }
		);
		expect( forward ).toEqual( [
			{ clientId: 'A', key: 'content', start: 5, end: 10 },
		] );
		expect( reverse ).toEqual( forward );
	} );
} );

describe( 'list items, which live inside their list', () => {
	const items = [
		[ 'core/list', { values: '' } ],
		[ 'core/list-item', { content: 'AAAAAAAAAA' }, 'A' ],
		[ 'core/list-item', { content: 'BBBBBBBBBB' }, 'A' ],
		[ 'core/list-item', { content: 'CCCCCCCCCC' }, 'A' ],
	];

	it( 'formats two items the same way either way', () => {
		const { forward, reverse } = bothWays(
			items,
			{ block: 1, offset: 4 },
			{ block: 2, offset: 6 }
		);
		expect( forward ).toEqual( [
			{ clientId: 'B', key: 'content', start: 4, end: 10 },
			{ clientId: 'C', key: 'content', start: 0, end: 6 },
		] );
		expect( reverse ).toEqual( forward );
	} );

	it( 'formats three items the same way either way', () => {
		const { forward, reverse } = bothWays(
			items,
			{ block: 1, offset: 4 },
			{ block: 3, offset: 6 }
		);
		expect( forward ).toEqual( [
			{ clientId: 'B', key: 'content', start: 4, end: 10 },
			{ clientId: 'C', key: 'content', start: 0, end: 10 },
			{ clientId: 'D', key: 'content', start: 0, end: 6 },
		] );
		expect( reverse ).toEqual( forward );
	} );
} );

describe( 'blocks with more than one rich text field', () => {
	it( 'formats the field each selection end names', () => {
		const blocks = [
			[ 'core/pullquote', { value: 'ABCDEFGHIJ', citation: 'Who' } ],
			[ 'core/pullquote', { value: 'KLMNOPQRST', citation: 'Who' } ],
		];
		const { forward, reverse } = bothWays(
			blocks,
			{ block: 0, offset: 5, attributeKey: 'value' },
			{ block: 1, offset: 5, attributeKey: 'value' }
		);
		expect( forward ).toEqual( [
			{ clientId: 'A', key: 'value', start: 5, end: 10 },
			{ clientId: 'B', key: 'value', start: 0, end: 5 },
		] );
		expect( reverse ).toEqual( forward );
	} );

	it( 'leaves a block in the middle alone: the field cannot be told', () => {
		const blocks = [
			[ 'core/paragraph', { content: 'ABCDEFGHIJ' } ],
			[ 'core/pullquote', { value: 'Middle', citation: 'Who' } ],
			[ 'core/paragraph', { content: 'KLMNOPQRST' } ],
		];
		const { forward, reverse } = bothWays(
			blocks,
			{ block: 0, offset: 5 },
			{ block: 2, offset: 5 }
		);
		expect( forward ).toEqual( [
			{ clientId: 'A', key: 'content', start: 5, end: 10 },
			{ clientId: 'C', key: 'content', start: 0, end: 5 },
		] );
		expect( reverse ).toEqual( forward );
	} );

	it( 'ignores an end that names a field which is not rich text', () => {
		const blocks = [
			[ 'core/list', { values: '<li>Markup</li>' } ],
			[ 'core/paragraph', { content: 'KLMNOPQRST' } ],
		];
		const { forward, reverse } = bothWays(
			blocks,
			{ block: 0, offset: 2, attributeKey: 'values' },
			{ block: 1, offset: 5 }
		);
		expect( forward ).toEqual( [
			{ clientId: 'B', key: 'content', start: 0, end: 5 },
		] );
		expect( reverse ).toEqual( forward );
	} );
} );

describe( 'selections the plugin will not act on', () => {
	it( 'does nothing when the two ends are not in the same parent', () => {
		const blocks = [
			[ 'core/paragraph', { content: 'ABCDEFGHIJ' } ],
			[ 'core/list', { values: '' } ],
			[ 'core/list-item', { content: 'KLMNOPQRST' }, 'B' ],
		];
		const { forward, reverse } = bothWays(
			blocks,
			{ block: 0, offset: 5 },
			{ block: 2, offset: 5 }
		);
		expect( forward ).toEqual( [] );
		expect( reverse ).toEqual( [] );
	} );
} );

describe( 'applying a format across blocks', () => {
	it( 'writes every block in one call, so one undo reverts it all', () => {
		const registry = editorWith(
			THREE,
			// Dragged upwards, from the last block to the first.
			{ block: 2, offset: 3 },
			{ block: 0, offset: 5 }
		);
		const target = createMultiTarget( registry, {
			palette: [],
			registered: [ 'core/underline' ],
		} );
		target.toggle( 'core/underline' );

		expect( registry.dispatched ).toHaveLength( 1 );
		const [ clientIds, attributes ] = registry.dispatched[ 0 ];
		expect( clientIds ).toEqual( [ 'A', 'B', 'C' ] );
		expect( String( attributes.A.content ) ).toBe(
			'AAAAA<span style="text-decoration: underline;">AAAAA</span>'
		);
		expect( String( attributes.C.content ) ).toBe(
			'<span style="text-decoration: underline;">CCC</span>CCCCCCC'
		);
	} );
} );
