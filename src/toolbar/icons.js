/**
 * Icons the core set does not have. Drawn on the same 24px grid as @wordpress/icons.
 */
import { SVG, Path, Rect } from '@wordpress/primitives';

/**
 * An icon with a bar under it in the current color, like TinyMCE's color buttons.
 *
 * @param {string} path  SVG path of the glyph.
 * @param {string} color Bar color.
 * @return {Element} Icon.
 */
export function withColorBar( path, color ) {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path d={ path } />
			<Rect
				x="4"
				y="19"
				width="16"
				height="3"
				rx="1"
				fill={ color || 'none' }
				stroke="rgba(0,0,0,.25)"
				strokeWidth="0.5"
			/>
		</SVG>
	);
}

/** "A" from core's textColor icon, raised to leave room for the bar. */
export const TEXT_COLOR_PATH =
	'M12.9 4h-2l-4 11h1.9l1.1-3h4.2l1.1 3h1.9L12.9 4zm-2.5 6.5l1.5-4.9 1.7 4.9h-3.2z';

/** A marker tip. */
export const HIGHLIGHT_PATH =
	'M15.2 3.3l4.5 4.5-7.6 7.6H7.6v-4.5l7.6-7.6zm0 2.1l-6.1 6.1v2.4h2.4l6.1-6.1-2.4-2.4zM4 15.5h2.5V17H4z';

/** A "T" struck through: no core icon exists for clear formatting. */
export const clearFormattingIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M6 5h12v1.5h-5.25V19h-1.5V6.5H6V5zm-.53 13.47l13-13 1.06 1.06-13 13-1.06-1.06z" />
	</SVG>
);

/** The classic editor's Ω, drawn as text so it follows the button color. */
export const specialCharactersIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<text
			x="12"
			y="17.5"
			textAnchor="middle"
			fontSize="16"
			fontFamily="Georgia, 'Times New Roman', serif"
			fill="currentColor"
		>
			Ω
		</text>
	</SVG>
);
