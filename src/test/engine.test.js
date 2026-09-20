/**
 * Unit tests for the formatting engine (no editor needed).
 */
import {
	applyFormat,
	create,
	registerFormatType,
	toHTMLString,
} from '@wordpress/rich-text';

import { isSafeColor, setColors } from '../engine/colors';
import { clearFormatting, CLEARABLE_FORMATS } from '../engine/formats';

// Same signatures and results as the block editor's color helpers.
jest.mock( '@wordpress/block-editor', () => ( {
	getColorClassName: ( context, slug ) => `has-${ slug }-${ context }`,
	getColorObjectByColorValue: ( palette, color ) =>
		palette.find( ( entry ) => entry.color === color ),
	getColorObjectByAttributeValues: ( palette, slug ) =>
		palette.find( ( entry ) => entry.slug === slug ) || {},
} ) );

const FORMATS = [
	[ 'core/bold', 'strong' ],
	[ 'core/italic', 'em' ],
	[ 'core/underline', 'span', null ],
	[ 'core/strikethrough', 's' ],
	[ 'core/subscript', 'sub' ],
	[ 'core/superscript', 'sup' ],
	[ 'core/code', 'code' ],
	[ 'core/keyboard', 'kbd' ],
	[ 'core/text-color', 'mark', 'has-inline-color' ],
	[ 'core/link', 'a' ],
	[ 'thirdparty/footnote', 'span', 'tp-footnote' ],
];

beforeAll( () => {
	FORMATS.forEach( ( [ name, tagName, className = null ] ) =>
		registerFormatType( name, {
			title: name,
			tagName,
			className,
			attributes: { style: 'style', class: 'class', url: 'href' },
			edit: () => null,
		} )
	);
} );

const PALETTE = [ { name: 'Accent 1', slug: 'accent-1', color: '#ffee58' } ];
const REGISTERED = FORMATS.map( ( [ name ] ) => name );
const selectAll = ( value ) => ( {
	...value,
	start: 0,
	end: value.text.length,
} );
const html = ( value ) => toHTMLString( { value } );

describe( 'setColors (same markup as core/text-color)', () => {
	it( 'writes a custom text color as an inline style', () => {
		const value = setColors(
			selectAll( create( { text: 'word' } ) ),
			PALETTE,
			{
				color: '#cf2e2e',
			}
		);
		expect( html( value ) ).toBe(
			'<mark style="background-color:rgba(0, 0, 0, 0);color:#cf2e2e" class="has-inline-color">word</mark>'
		);
	} );

	it( 'writes a palette color as a class', () => {
		const value = setColors(
			selectAll( create( { text: 'word' } ) ),
			PALETTE,
			{
				color: '#ffee58',
			}
		);
		expect( html( value ) ).toContain( 'has-accent-1-color' );
		expect( html( value ) ).not.toContain( 'color:#ffee58' );
	} );

	it( 'keeps the text color when the highlight is added', () => {
		let value = selectAll( create( { text: 'word' } ) );
		value = setColors( value, PALETTE, { color: '#cf2e2e' } );
		value = setColors( selectAll( value ), PALETTE, {
			backgroundColor: '#fcb900',
		} );
		expect( html( value ) ).toContain(
			'background-color:#fcb900;color:#cf2e2e'
		);
	} );

	it( 'removes the mark when both colors are cleared', () => {
		let value = selectAll( create( { text: 'word' } ) );
		value = setColors( value, PALETTE, { color: '#cf2e2e' } );
		value = setColors( selectAll( value ), PALETTE, { color: undefined } );
		expect( html( value ) ).toBe( 'word' );
	} );
} );

describe( 'isSafeColor / setColors hardening', () => {
	it( 'accepts plain color syntax', () => {
		[
			'#cf2e2e',
			'#FFF',
			'rgb(1, 2, 3)',
			'rgba(0,0,0,.5)',
			'hsl(120deg 50% 50%)',
			'var(--wp--preset--color--accent-1)',
			'red',
		].forEach( ( color ) => expect( isSafeColor( color ) ).toBe( true ) );
	} );

	it( 'rejects values that could carry other CSS or markup', () => {
		[
			'red;position:fixed',
			'url(https://example.org/x.png)',
			'"><script>',
			'expression(alert(1))',
			'',
			null,
			{},
		].forEach( ( color ) => expect( isSafeColor( color ) ).toBe( false ) );
	} );

	it( 'leaves the text untouched when given an unsafe color', () => {
		const value = selectAll( create( { text: 'word' } ) );
		expect(
			html( setColors( value, PALETTE, { color: 'red;display:none' } ) )
		).toBe( 'word' );
	} );
} );

describe( 'clearFormatting', () => {
	it( 'only lists format names that exist in core', () => {
		expect( CLEARABLE_FORMATS ).not.toContain( 'core/link' );
	} );

	it( 'removes known formats and keeps links and unknown formats', () => {
		let value = create( { text: 'Alpha beta gamma' } );
		value = applyFormat( value, { type: 'core/bold' }, 0, 16 );
		value = applyFormat(
			value,
			{ type: 'core/link', attributes: { url: 'https://example.org' } },
			6,
			10
		);
		value = applyFormat( value, { type: 'thirdparty/footnote' }, 11, 16 );
		value = applyFormat( value, { type: 'core/strikethrough' }, 0, 5 );

		const result = html(
			clearFormatting( selectAll( value ), REGISTERED )
		);

		expect( result ).not.toContain( '<strong>' );
		expect( result ).not.toContain( '<s>' );
		expect( result ).toContain( '<a href="https://example.org">beta</a>' );
		expect( result ).toContain( '<span class="tp-footnote">gamma</span>' );
	} );

	it( 'ignores format names that are not registered', () => {
		const value = selectAll( create( { text: 'word' } ) );
		expect( () => clearFormatting( value, [] ) ).not.toThrow();
	} );
} );
