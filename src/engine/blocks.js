/**
 * Block-level tools: paragraph/heading, lists, quote and text alignment.
 * Everything goes through the blocks' own transforms and attributes.
 */
import {
	cloneBlock,
	getBlockType,
	hasBlockSupport,
	switchToBlockType,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

const TEXT_ALIGN_SUPPORT = 'typography.textAlign';

function selectedBlocks( registry ) {
	const editor = registry.select( blockEditorStore );
	return editor
		.getSelectedBlockClientIds()
		.map( ( clientId ) => editor.getBlock( clientId ) )
		.filter( Boolean );
}

/**
 * Nearest block named `name` at or above `clientId`.
 *
 * @param {Object} registry Data registry.
 * @param {string} clientId Block to start from.
 * @param {string} name     Block name to look for.
 * @return {string|null} Client ID.
 */
function closest( registry, clientId, name ) {
	if ( ! clientId ) {
		return null;
	}
	const editor = registry.select( blockEditorStore );
	if ( editor.getBlockName( clientId ) === name ) {
		return clientId;
	}
	const parents = editor.getBlockParentsByBlockName( clientId, name );
	return parents.length ? parents[ parents.length - 1 ] : null;
}

/**
 * Replaces blocks through their registered transforms; returns false when none applies.
 *
 * @param {Object}  registry   Data registry.
 * @param {Array}   blocks     Blocks to replace.
 * @param {string}  name       Target block name.
 * @param {Object=} attributes Attributes to set on the result.
 * @return {boolean} Whether a transform applied.
 */
function switchBlocks( registry, blocks, name, attributes ) {
	if ( ! blocks.length ) {
		return false;
	}
	const result = switchToBlockType( blocks, name );
	if ( ! result?.length ) {
		return false;
	}
	const next = attributes
		? result.map( ( block ) => ( {
				...block,
				attributes: { ...block.attributes, ...attributes },
			} ) )
		: result;
	registry.dispatch( blockEditorStore ).replaceBlocks(
		blocks.map( ( block ) => block.clientId ),
		next
	);
	return true;
}

/**
 * State of the selected block, for the pressed/available look of the controls.
 *
 * @param {Function} select Data select.
 * @return {Object} Plain values only, so useSelect can compare them.
 */
export function getBlockState( select ) {
	const editor = select( blockEditorStore );
	const ids = editor.getSelectedBlockClientIds();
	const first = ids.length ? editor.getBlock( ids[ 0 ] ) : null;
	if ( ! first ) {
		return { name: null };
	}
	const listId =
		first.name === 'core/list'
			? first.clientId
			: editor
					.getBlockParentsByBlockName( first.clientId, 'core/list' )
					.slice( -1 )[ 0 ];
	return {
		name: first.name,
		level: first.name === 'core/heading' ? first.attributes.level : null,
		ordered: listId
			? !! editor.getBlockAttributes( listId )?.ordered
			: null,
		inQuote:
			first.name === 'core/quote' ||
			editor.getBlockParentsByBlockName( first.clientId, 'core/quote' )
				.length > 0,
		textAlign: textAlignOf( first ),
		alignable: !! alignmentStorage( first.name ),
	};
}

/**
 * Where a block keeps its text alignment, so the toolbar writes it the way
 * the block's own "Align text" control does:
 * - "support":   style.typography.textAlign (typography.textAlign support);
 * - "textAlign": a textAlign attribute (e.g. quote, and headings before that support);
 * - "align":     the paragraph's legacy align attribute (WordPress 6.6–6.x),
 *                only when the paragraph has no block (wide/full) alignment.
 *
 * @param {string} blockName Block name.
 * @return {string|null} Storage, or null when the block has no text alignment.
 */
function alignmentStorage( blockName ) {
	if ( ! blockName ) {
		return null;
	}
	if ( hasBlockSupport( blockName, TEXT_ALIGN_SUPPORT ) ) {
		return 'support';
	}
	const attributes = getBlockType( blockName )?.attributes || {};
	if ( attributes.textAlign ) {
		return 'textAlign';
	}
	if (
		blockName === 'core/paragraph' &&
		attributes.align &&
		! hasBlockSupport( blockName, 'align' )
	) {
		return 'align';
	}
	return null;
}

function textAlignOf( block ) {
	switch ( alignmentStorage( block.name ) ) {
		case 'support':
			return block.attributes.style?.typography?.textAlign ?? null;
		case 'textAlign':
			return block.attributes.textAlign ?? null;
		case 'align':
			return block.attributes.align ?? null;
		default:
			return null;
	}
}

export function setParagraph( registry ) {
	switchBlocks(
		registry,
		selectedBlocks( registry ).filter(
			( block ) => block.name !== 'core/paragraph'
		),
		'core/paragraph'
	);
}

export function setHeading( registry, level ) {
	const blocks = selectedBlocks( registry );
	const headings = blocks.filter(
		( block ) => block.name === 'core/heading'
	);
	// Batched so a mixed selection (headings + paragraphs) is one undo step.
	registry.batch( () => {
		if ( headings.length ) {
			registry.dispatch( blockEditorStore ).updateBlockAttributes(
				headings.map( ( block ) => block.clientId ),
				{ level }
			);
		}
		switchBlocks(
			registry,
			blocks.filter( ( block ) => block.name !== 'core/heading' ),
			'core/heading',
			{ level }
		);
	} );
}

/**
 * The same list type again turns the list back into paragraphs, like the classic editor.
 *
 * @param {Object}  registry Data registry.
 * @param {boolean} ordered  Numbered list.
 */
export function toggleList( registry, ordered ) {
	const blocks = selectedBlocks( registry );
	const listId =
		blocks.length && closest( registry, blocks[ 0 ].clientId, 'core/list' );
	if ( ! listId ) {
		switchBlocks( registry, blocks, 'core/list', { ordered } );
		return;
	}
	const list = registry.select( blockEditorStore ).getBlock( listId );
	if ( !! list.attributes.ordered === ordered ) {
		switchBlocks( registry, [ list ], 'core/paragraph' );
	} else {
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( listId, { ordered } );
	}
}

export function toggleQuote( registry ) {
	const blocks = selectedBlocks( registry );
	const quoteId =
		blocks.length &&
		closest( registry, blocks[ 0 ].clientId, 'core/quote' );
	if ( ! quoteId ) {
		switchBlocks( registry, blocks, 'core/quote' );
		return;
	}
	const quote = registry.select( blockEditorStore ).getBlock( quoteId );
	if ( ! switchBlocks( registry, [ quote ], 'core/paragraph' ) ) {
		// No transform back: unwrap the quote's inner blocks as they are.
		registry.dispatch( blockEditorStore ).replaceBlocks(
			quoteId,
			quote.innerBlocks.map( ( block ) => cloneBlock( block ) )
		);
	}
}

/**
 * Stored like the editor's own "Align text" control; the active alignment again removes it.
 *
 * @param {Object} registry Data registry.
 * @param {string} align    left, center or right.
 */
export function toggleAlign( registry, align ) {
	const attributes = {};
	selectedBlocks( registry ).forEach( ( block ) => {
		const next = textAlignOf( block ) === align ? undefined : align;
		switch ( alignmentStorage( block.name ) ) {
			case 'support': {
				const style = block.attributes.style || {};
				attributes[ block.clientId ] = {
					style: {
						...style,
						typography: { ...style.typography, textAlign: next },
					},
				};
				break;
			}
			case 'textAlign':
				attributes[ block.clientId ] = { textAlign: next };
				break;
			case 'align':
				attributes[ block.clientId ] = { align: next };
				break;
		}
	} );
	const ids = Object.keys( attributes );
	if ( ids.length ) {
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( ids, attributes, true );
	}
}
