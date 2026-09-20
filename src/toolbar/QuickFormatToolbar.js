/**
 * The toolbar, rendered into the editor's own block toolbar through
 * BlockControls. Where that toolbar shows (next to the block, or at the top
 * with the editor's "Top toolbar" option) is entirely the editor's business.
 * - group "other": inline tools, right after the editor's bold / italic / link;
 * - group "block": optional block tools, with the block's own controls.
 * Each section of the catalog is one ToolbarGroup, so the editor draws the
 * separators between them. When the toolbar runs out of room (see useFits),
 * the less used sections fold into one "More formatting" menu.
 */
import { useMemo } from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	alignCenter,
	alignLeft,
	alignRight,
	moreHorizontal,
} from '@wordpress/icons';
import { store as richTextStore } from '@wordpress/rich-text';

import { DENSITIES, usePreference } from '../preferences';
import {
	getBlockState,
	setHeading,
	setParagraph,
	toggleAlign,
	toggleList,
	toggleQuote,
} from '../engine/blocks';
import { FOLDABLE_SECTIONS, TOOLS, TOOL_ORDER, isAvailable } from './tools';
import useFits from './useFits';
import ColorSplitButton, { allowedColor } from './ColorSplitButton';
import { HIGHLIGHT_PATH, TEXT_COLOR_PATH, withColorBar } from './icons';
import { BlockTypeControl, SpecialCharactersControl } from './controls';

const ALIGNMENTS = [
	{
		align: 'left',
		icon: alignLeft,
		label: __( 'Align text left', 'quick-format-toolbar' ),
	},
	{
		align: 'center',
		icon: alignCenter,
		label: __( 'Align text center', 'quick-format-toolbar' ),
	},
	{
		align: 'right',
		icon: alignRight,
		label: __( 'Align text right', 'quick-format-toolbar' ),
	},
];

/** Registered format names; the list only changes when a plugin registers a format. */
export function useRegisteredFormats() {
	const formatTypes = useSelect(
		( select ) => select( richTextStore ).getFormatTypes(),
		[]
	);
	return useMemo(
		() => formatTypes.map( ( format ) => format.name ),
		[ formatTypes ]
	);
}

/** Theme palette and custom-color permission, as core/text-color reads them. */
export function useColorSettings() {
	return useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			palette: settings.colors || [],
			allowCustom: ! settings.disableCustomColors,
		};
	}, [] );
}

export default function QuickFormatToolbar( {
	target,
	registered,
	palette,
	allowCustom,
} ) {
	const registry = useRegistry();
	const blockState = useSelect( getBlockState, [] );
	const [ enabled ] = usePreference( 'tools' );
	const [ density ] = usePreference( 'density' );
	const cell = DENSITIES[ density ] || DENSITIES.normal;
	const [ textColor ] = usePreference( 'textColor' );
	const [ highlightColor ] = usePreference( 'highlightColor' );

	const actions = useMemo(
		() => ( {
			setParagraph: () => setParagraph( registry ),
			setHeading: ( level ) => setHeading( registry, level ),
			toggleList: ( ordered ) => toggleList( registry, ordered ),
			toggleQuote: () => toggleQuote( registry ),
			toggleAlign: ( align ) => toggleAlign( registry, align ),
		} ),
		[ registry ]
	);

	const context = {
		target,
		blockState,
		registered,
		hasColors: allowCustom || palette.length > 0,
	};
	const shown = TOOL_ORDER.filter(
		( id ) => enabled.includes( id ) && isAvailable( TOOLS[ id ], context )
	);

	const button = ( key, props ) => <ToolbarButton key={ key } { ...props } />;

	const renderTool = ( id ) => {
		const tool = TOOLS[ id ];
		switch ( tool.kind ) {
			case 'format':
				return button( id, {
					icon: tool.icon,
					label: tool.label,
					isPressed: target.isActive( tool.format ),
					onClick: () => target.toggle( tool.format ),
				} );
			case 'split':
				return (
					<ColorSplitButton
						key={ id }
						tool={ tool }
						target={ target }
						palette={ palette }
						allowCustom={ allowCustom }
					/>
				);
			case 'clear':
				return button( id, {
					icon: tool.icon,
					label: tool.label,
					onClick: target.clear,
				} );
			case 'chars':
				return (
					<SpecialCharactersControl
						key={ id }
						tool={ tool }
						target={ target }
					/>
				);
			case 'blockType':
				return (
					<BlockTypeControl
						key={ id }
						blockState={ blockState }
						actions={ actions }
					/>
				);
			case 'list':
				return button( id, {
					icon: tool.icon,
					label: tool.label,
					isPressed: blockState.ordered === tool.ordered,
					onClick: () => actions.toggleList( tool.ordered ),
				} );
			case 'quote':
				return button( id, {
					icon: tool.icon,
					label: tool.label,
					isPressed: blockState.inQuote,
					onClick: actions.toggleQuote,
				} );
			case 'alignment':
				return ALIGNMENTS.map( ( { align, icon, label } ) =>
					button( `${ id }-${ align }`, {
						icon,
						label,
						isPressed: blockState.textAlign === align,
						onClick: () => actions.toggleAlign( align ),
					} )
				);
		}
		return null;
	};

	// One ToolbarGroup per section, in catalog order.
	const groupsOf = ( group ) => {
		const sections = [];
		shown
			.filter( ( id ) => TOOLS[ id ].group === group )
			.forEach( ( id ) => {
				const section = TOOLS[ id ].section;
				const last = sections[ sections.length - 1 ];
				if ( last?.section === section ) {
					last.ids.push( id );
				} else {
					sections.push( { section, ids: [ id ] } );
				}
			} );
		return sections;
	};

	const groupClass = `qft-toolbar is-density-${
		density in DENSITIES ? density : 'normal'
	}`;
	const renderGroups = ( sections ) =>
		sections.map( ( { section, ids } ) => (
			<ToolbarGroup key={ section } className={ groupClass }>
				{ ids.map( renderTool ) }
			</ToolbarGroup>
		) );

	const blockSections = groupsOf( 'block' );
	const inlineSections = groupsOf( 'inline' );
	// Two parts can fold into "More formatting", the less used one first:
	// level 1 folds superscript / subscript / clear / code, level 2 the rest.
	// Special characters never fold: the menu has no room for their grid, so
	// folding them would take an enabled tool away with nothing in its place.
	const isChars = ( { section } ) => section === 'chars';
	const sectionsOf = {
		foldable: inlineSections.filter(
			( section ) =>
				FOLDABLE_SECTIONS.includes( section.section ) &&
				! isChars( section )
		),
		chars: inlineSections.filter( isChars ),
		primary: inlineSections.filter(
			( section ) =>
				! FOLDABLE_SECTIONS.includes( section.section ) &&
				! isChars( section )
		),
	};
	const parts = [ 'foldable', 'primary' ]
		.filter( ( key ) => sectionsOf[ key ].length )
		.map( ( key ) => ( {
			key,
			// Until a part has been shown and measured: a generous guess.
			estimate: sectionsOf[ key ].reduce(
				( width, { ids } ) => width + ids.length * cell * 1.5 + 8,
				0
			),
		} ) );
	const { level, fitRef, roomRef, roomOffset, partRef } = useFits(
		parts,
		cell
	);
	const folded = parts.slice( 0, level ).map( ( { key } ) => key );

	const menuControl = ( id ) => {
		const tool = TOOLS[ id ];
		switch ( tool.kind ) {
			case 'format':
				return {
					title: tool.label,
					icon: tool.icon,
					isActive: target.isActive( tool.format ),
					role: 'menuitemcheckbox',
					onClick: () => target.toggle( tool.format ),
				};
			case 'clear':
				return {
					title: tool.label,
					icon: tool.icon,
					onClick: target.clear,
				};
			case 'split': {
				// No room for the palette here: the menu applies the last color.
				const color = allowedColor(
					tool.property === 'color' ? textColor : highlightColor,
					palette,
					allowCustom
				);
				return {
					title: tool.label,
					icon: withColorBar(
						tool.property === 'color'
							? TEXT_COLOR_PATH
							: HIGHLIGHT_PATH,
						color
					),
					onClick: () =>
						target.setColors( { [ tool.property ]: color } ),
				};
			}
		}
		// Special characters need their grid, which no menu item can hold; they
		// stay on the toolbar instead (see sectionsOf above), so nothing is lost.
		return null;
	};
	const menuControls = [ 'primary', 'foldable' ]
		.filter( ( part ) => folded.includes( part ) )
		.flatMap( ( part ) => sectionsOf[ part ].flatMap( ( { ids } ) => ids ) )
		.map( menuControl )
		.filter( Boolean );

	return (
		<>
			{ blockSections.length > 0 && (
				<BlockControls group="block">
					{ renderGroups( blockSections ) }
				</BlockControls>
			) }
			{ inlineSections.length > 0 && (
				<BlockControls group="other">
					{ [ 'primary', 'chars', 'foldable' ]
						.filter(
							( part ) =>
								sectionsOf[ part ].length &&
								! folded.includes( part )
						)
						.map( ( part ) => (
							<div
								key={ part }
								ref={ partRef( part ) }
								className="qft-part"
							>
								{ renderGroups( sectionsOf[ part ] ) }
							</div>
						) ) }
					{ menuControls.length > 0 && (
						<div ref={ partRef( 'menu' ) } className="qft-part">
							<ToolbarGroup className={ groupClass }>
								<ToolbarDropdownMenu
									icon={ moreHorizontal }
									label={ __(
										'More formatting',
										'quick-format-toolbar'
									) }
									controls={ menuControls }
								/>
							</ToolbarGroup>
						</div>
					) }
					<span className="qft-probe-anchor" aria-hidden="true">
						<span
							className="qft-probe"
							ref={ fitRef }
							style={ { insetInlineStart: `${ cell }px` } }
						/>
						{ roomOffset !== null && (
							<span
								className="qft-probe"
								ref={ roomRef }
								style={ {
									insetInlineStart: `${ roomOffset }px`,
								} }
							/>
						) }
					</span>
				</BlockControls>
			) }
		</>
	);
}
