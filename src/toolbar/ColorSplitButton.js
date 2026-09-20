/**
 * Split color button, like TinyMCE's colorbutton:
 * the main part applies the current color in one click; the arrow opens the
 * theme palette, and a color picked there becomes current and is applied.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	Button,
	ColorIndicator,
	ColorPalette,
	ColorPicker,
	Dropdown,
	ToolbarButton,
	ToolbarItem,
} from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

import { usePreference } from '../preferences';
import { HIGHLIGHT_PATH, TEXT_COLOR_PATH, withColorBar } from './icons';

const PREFERENCE = { color: 'textColor', backgroundColor: 'highlightColor' };

function colorName( palette, color ) {
	return (
		palette.find(
			( entry ) => entry.color?.toLowerCase() === color?.toLowerCase()
		)?.name || color
	);
}

/**
 * The remembered color, unless the theme forbids custom colors and it is not
 * in the palette: then the palette's first color.
 *
 * @param {string}  color       Remembered color.
 * @param {Array}   palette     Theme palette.
 * @param {boolean} allowCustom Whether custom colors are allowed.
 * @return {string|undefined} Color to apply.
 */
export function allowedColor( color, palette, allowCustom ) {
	const inPalette = palette.some(
		( entry ) => entry.color?.toLowerCase() === color?.toLowerCase()
	);
	if ( allowCustom || inPalette ) {
		return color;
	}
	return palette[ 0 ]?.color;
}

function CustomColor( { initial, onApply } ) {
	const [ color, setColor ] = useState( initial );
	return (
		<div className="qft-color-popover__custom">
			<ColorPicker
				color={ color }
				onChange={ setColor }
				enableAlpha={ false }
			/>
			<Button
				variant="primary"
				size="compact"
				onClick={ () => onApply( color ) }
			>
				{ __( 'Apply color', 'quick-format-toolbar' ) }
			</Button>
		</div>
	);
}

export default function ColorSplitButton( {
	tool,
	target,
	palette,
	allowCustom,
} ) {
	const { property } = tool;
	const [ stored, setCurrent ] = usePreference( PREFERENCE[ property ] );
	const current = allowedColor( stored, palette, allowCustom );
	const [ customOpen, setCustomOpen ] = useState( false );
	const isText = property === 'color';
	const apply = ( color ) => target.setColors( { [ property ]: color } );
	const onSelection = target.activeColors()[ property ];

	const name = colorName( palette, current );
	const mainLabel = isText
		? /* translators: %s: color name or value. */
			sprintf( __( 'Text color: %s', 'quick-format-toolbar' ), name )
		: /* translators: %s: color name or value. */
			sprintf( __( 'Highlight: %s', 'quick-format-toolbar' ), name );

	return (
		<div className="qft-split">
			<ToolbarButton
				className="qft-split__main"
				icon={ withColorBar(
					isText ? TEXT_COLOR_PATH : HIGHLIGHT_PATH,
					current
				) }
				label={ mainLabel }
				onClick={ () => apply( current ) }
			/>
			<ToolbarItem>
				{ ( itemProps ) => (
					<Dropdown
						popoverProps={ { placement: 'bottom-start' } }
						onToggle={ ( isOpen ) =>
							! isOpen && setCustomOpen( false )
						}
						renderToggle={ ( { isOpen, onToggle } ) => (
							<Button
								{ ...itemProps }
								className="qft-split__toggle"
								icon={ chevronDown }
								label={
									isText
										? __(
												'Choose text color',
												'quick-format-toolbar'
											)
										: __(
												'Choose highlight color',
												'quick-format-toolbar'
											)
								}
								showTooltip
								aria-expanded={ isOpen }
								aria-haspopup="true"
								onClick={ onToggle }
							/>
						) }
						renderContent={ ( { onClose } ) => (
							<div className="qft-color-popover">
								<p className="qft-color-popover__title">
									{ isText
										? __(
												'Text color',
												'quick-format-toolbar'
											)
										: __(
												'Highlight',
												'quick-format-toolbar'
											) }
									{ onSelection && (
										<ColorIndicator
											colorValue={ onSelection }
										/>
									) }
								</p>
								<ColorPalette
									colors={ palette }
									value={ onSelection }
									disableCustomColors
									clearable
									onChange={ ( color ) => {
										if ( color ) {
											setCurrent( color );
										}
										apply( color );
										onClose();
									} }
								/>
								{ allowCustom && ! customOpen && (
									<Button
										variant="link"
										onClick={ () => setCustomOpen( true ) }
									>
										{ __(
											'Custom color…',
											'quick-format-toolbar'
										) }
									</Button>
								) }
								{ allowCustom && customOpen && (
									<CustomColor
										initial={ current }
										onApply={ ( color ) => {
											setCurrent( color );
											apply( color );
											onClose();
										} }
									/>
								) }
							</div>
						) }
					/>
				) }
			</ToolbarItem>
		</div>
	);
}
