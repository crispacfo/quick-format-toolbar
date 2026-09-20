/**
 * Where the toolbar comes from.
 *
 * Single rich text: a format type whose edit() RichText renders while it is
 * selected. RichText hands it value/onChange, so the toolbar edits text through
 * the same path as the editor's own formats (one undo step, selection kept).
 * Blocks whose RichText limits allowedFormats do not render it: no toolbar there.
 *
 * Several blocks: RichText is not selected then, so an editor.BlockEdit filter
 * renders the toolbar for the first selected block. BlockControls shows it
 * only when the editor itself would show that block's controls.
 */
import { __ } from '@wordpress/i18n';
import { memo, useMemo, useRef } from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import { registerFormatType } from '@wordpress/rich-text';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

import {
	createMultiTarget,
	createSingleTarget,
	formatSignature,
} from './engine/targets';
import QuickFormatToolbar, {
	useColorSettings,
	useRegisteredFormats,
} from './toolbar/QuickFormatToolbar';

export const CONTROLLER_FORMAT = 'quick-format-toolbar/controller';

// Re-renders only when its props change: for the focused rich text that is the
// format signature, not every keystroke. Each re-render would also redraw the
// editor's whole block toolbar, since the toolbar is filled through BlockControls.
const MemoToolbar = memo( QuickFormatToolbar );

function SingleController( { value, onChange } ) {
	const registered = useRegisteredFormats();
	const { palette, allowCustom } = useColorSettings();
	const latest = useRef();
	latest.current = { value, onChange };
	const target = useMemo(
		() =>
			createSingleTarget( () => latest.current, { palette, registered } ),
		[ palette, registered ]
	);
	return (
		<MemoToolbar
			target={ target }
			signature={ formatSignature( value ) }
			registered={ registered }
			palette={ palette }
			allowCustom={ allowCustom }
		/>
	);
}

function MultiController() {
	const registry = useRegistry();
	const registered = useRegisteredFormats();
	const { palette, allowCustom } = useColorSettings();
	// Changes whenever the selection or the selected blocks' content changes.
	const selection = useSelect( ( select ) => {
		const editor = select( blockEditorStore );
		return [
			editor.getSelectionStart(),
			editor.getSelectionEnd(),
			...editor
				.getMultiSelectedBlockClientIds()
				.map( ( id ) => editor.getBlockAttributes( id ) ),
		];
	}, [] );
	const target = useMemo(
		() => createMultiTarget( registry, { palette, registered } ),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `selection` stands for the store state read inside.
		[ registry, palette, registered, selection ]
	);
	if ( ! target ) {
		return null;
	}
	return (
		<MemoToolbar
			target={ target }
			registered={ registered }
			palette={ palette }
			allowCustom={ allowCustom }
		/>
	);
}

const withMultiSelectionToolbar = createHigherOrderComponent(
	( BlockEdit ) =>
		function QuickFormatBlockEdit( props ) {
			const isFirst = useSelect(
				( select ) =>
					select( blockEditorStore ).isFirstMultiSelectedBlock(
						props.clientId
					),
				[ props.clientId ]
			);
			return (
				<>
					<BlockEdit { ...props } />
					{ isFirst && <MultiController /> }
				</>
			);
		},
	'withQuickFormatMultiSelectionToolbar'
);

export function registerControllers() {
	registerFormatType( CONTROLLER_FORMAT, {
		title: __( 'Quick Format Toolbar', 'quick-format-toolbar' ),
		// Never applied to text: this format only exists for its edit().
		tagName: 'span',
		className: 'qft-controller',
		edit: SingleController,
	} );
	addFilter(
		'editor.BlockEdit',
		'quick-format-toolbar/multi-selection',
		withMultiSelectionToolbar
	);
}
