/**
 * Controls with a menu or popover: block type and special characters.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Dropdown,
	ToolbarButton,
	ToolbarDropdownMenu,
	ToolbarItem,
} from '@wordpress/components';
import {
	headingLevel1,
	headingLevel2,
	headingLevel3,
	headingLevel4,
	headingLevel5,
	headingLevel6,
	paragraph,
} from '@wordpress/icons';

import { SPECIAL_CHARACTERS } from './tools';

const HEADING_ICONS = [
	null,
	headingLevel1,
	headingLevel2,
	headingLevel3,
	headingLevel4,
	headingLevel5,
	headingLevel6,
];

/**
 * "P ▾": paragraph and H1–H6, through the blocks' own transforms.
 *
 * @param {Object} blockState Selected block state.
 * @param {Object} actions    Block actions.
 * @return {Array} Menu options.
 */
export function blockTypeOptions( blockState, actions ) {
	return [
		{
			key: 'p',
			title: __( 'Paragraph', 'quick-format-toolbar' ),
			icon: paragraph,
			isActive: blockState.name === 'core/paragraph',
			onClick: actions.setParagraph,
		},
		...[ 1, 2, 3, 4, 5, 6 ].map( ( level ) => ( {
			key: `h${ level }`,
			/* translators: %d: heading level, 1 to 6. */
			title: sprintf( __( 'Heading %d', 'quick-format-toolbar' ), level ),
			icon: HEADING_ICONS[ level ],
			isActive:
				blockState.name === 'core/heading' &&
				blockState.level === level,
			onClick: () => actions.setHeading( level ),
		} ) ),
	];
}

export function BlockTypeControl( { blockState, actions } ) {
	const options = blockTypeOptions( blockState, actions );
	const active = options.find( ( option ) => option.isActive );
	return (
		<ToolbarDropdownMenu
			icon={ active?.icon || paragraph }
			label={ __( 'Paragraph and headings', 'quick-format-toolbar' ) }
			// menuitemradio: the current type is announced as checked.
			controls={ options.map( ( { key, ...option } ) => ( {
				...option,
				role: 'menuitemradio',
			} ) ) }
		/>
	);
}

function CharacterGrid( { onInsert } ) {
	return (
		<div
			className="qft-chars"
			role="group"
			aria-label={ __( 'Special characters', 'quick-format-toolbar' ) }
		>
			{ SPECIAL_CHARACTERS.map( ( character ) => (
				<Button
					key={ character }
					className="qft-chars__item"
					size="small"
					label={ sprintf(
						/* translators: %s: a character such as — or ©. */
						__( 'Insert %s', 'quick-format-toolbar' ),
						character
					) }
					onClick={ () => onInsert( character ) }
				>
					{ character }
				</Button>
			) ) }
		</div>
	);
}

/**
 * Ω: inserts at the caret; stays open so several characters can go in a row.
 *
 * @param {Object} props        Component props.
 * @param {Object} props.tool   Tool definition.
 * @param {Object} props.target Formatting target.
 * @return {Element} Control.
 */
export function SpecialCharactersControl( { tool, target } ) {
	return (
		<ToolbarItem>
			{ ( itemProps ) => (
				<Dropdown
					popoverProps={ { placement: 'bottom-start' } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<ToolbarButton
							{ ...itemProps }
							icon={ tool.icon }
							label={ tool.label }
							aria-expanded={ isOpen }
							aria-haspopup="true"
							onClick={ onToggle }
						/>
					) }
					renderContent={ () => (
						<CharacterGrid onInsert={ target.insert } />
					) }
				/>
			) }
		</ToolbarItem>
	);
}
