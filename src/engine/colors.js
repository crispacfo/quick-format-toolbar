/**
 * Text color and highlight, serialized exactly like core/text-color
 * (format-library/src/text-color/inline.js): one <mark> carrying both.
 */
import {
	applyFormat,
	getActiveFormat,
	removeFormat,
} from '@wordpress/rich-text';
import {
	getColorClassName,
	getColorObjectByAttributeValues,
	getColorObjectByColorValue,
} from '@wordpress/block-editor';

export const TEXT_COLOR = 'core/text-color';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

function parseStyle( css = '' ) {
	const colors = {};
	css.split( ';' ).forEach( ( rule ) => {
		const index = rule.indexOf( ':' );
		if ( index < 0 ) {
			return;
		}
		const property = rule.slice( 0, index ).trim();
		const value = rule.slice( index + 1 ).trim();
		if ( property === 'color' ) {
			colors.color = value;
		}
		if ( property === 'background-color' && value !== TRANSPARENT ) {
			colors.backgroundColor = value;
		}
	} );
	return colors;
}

function parseClassName( className = '', palette = [] ) {
	const colors = {};
	className.split( ' ' ).forEach( ( name ) => {
		if ( name.startsWith( 'has-' ) && name.endsWith( '-color' ) ) {
			const slug = name.replace( /^has-/, '' ).replace( /-color$/, '' );
			const colorObject = getColorObjectByAttributeValues(
				palette,
				slug
			);
			if ( colorObject?.color ) {
				colors.color = colorObject.color;
			}
		}
	} );
	return colors;
}

/**
 * @param {Object} value   Rich text value.
 * @param {Array}  palette Theme palette ({ name, slug, color }).
 * @return {{color?: string, backgroundColor?: string}} Colors on the selection.
 */
export function getActiveColors( value, palette ) {
	const format = getActiveFormat( value, TEXT_COLOR );
	if ( ! format ) {
		return {};
	}
	return {
		...parseStyle( format.attributes?.style ),
		...parseClassName( format.attributes?.class, palette ),
	};
}

/**
 * Sets or clears the text color and/or highlight on the selection, keeping the other one.
 * A key present with an undefined value removes that color.
 *
 * @param {Object} value   Rich text value.
 * @param {Array}  palette Theme palette.
 * @param {Object} patch   { color } and/or { backgroundColor }.
 * @return {Object} New rich text value.
 */
const SAFE_COLOR = [
	/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
	/^(?:rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s/+\-degturad]+\)$/i,
	/^var\(--[a-z0-9-]+\)$/i,
	/^[a-z]+$/i,
];

/**
 * Whether a color value is plain CSS color syntax. The remembered colors come
 * from the user's saved preferences and end up in a style attribute, so only
 * values that cannot carry other CSS (no ";", "url(", quotes…) are applied.
 *
 * @param {*} color Candidate color.
 * @return {boolean} Safe to write into style.
 */
export function isSafeColor( color ) {
	return (
		typeof color === 'string' &&
		color.length <= 64 &&
		SAFE_COLOR.some( ( pattern ) => pattern.test( color.trim() ) )
	);
}

export function setColors( value, palette, patch ) {
	// Undefined removes a color; anything else must be a plain color.
	const unsafe = Object.values( patch ).some(
		( color ) => color !== undefined && ! isSafeColor( color )
	);
	if ( unsafe ) {
		return value;
	}
	const { color, backgroundColor } = {
		...getActiveColors( value, palette ),
		...patch,
	};
	if ( ! color && ! backgroundColor ) {
		return removeFormat( value, TEXT_COLOR );
	}
	const styles = [ `background-color:${ backgroundColor || TRANSPARENT }` ];
	const attributes = {};
	if ( color ) {
		const colorObject = getColorObjectByColorValue( palette, color );
		if ( colorObject?.slug ) {
			attributes.class = getColorClassName( 'color', colorObject.slug );
		} else {
			styles.push( `color:${ color }` );
		}
	}
	attributes.style = styles.join( ';' );
	return applyFormat( value, { type: TEXT_COLOR, attributes } );
}
