/**
 * Inspector Shortcuts must only touch supported features and never throw.
 */
import { openDefaultControls } from '../inspector-shortcuts';

let mockPreferences = {};
jest.mock( '@wordpress/data', () => ( {
	select: () => ( { get: ( scope, name ) => mockPreferences[ name ] } ),
} ) );
jest.mock( '@wordpress/preferences', () => ( { store: 'core/preferences' } ) );

describe( 'openDefaultControls', () => {
	beforeEach( () => {
		mockPreferences = {
			inspectorEnabled: true,
			inspectorShortcuts: [ 'padding', 'lineHeight', 'border' ],
		};
	} );

	it( 'does nothing while the experimental module is off (the default)', () => {
		mockPreferences = {};
		const settings = { supports: { spacing: { padding: true } } };
		expect( openDefaultControls( settings ) ).toBe( settings );
	} );

	it( 'opens only the controls the block supports', () => {
		const settings = openDefaultControls( {
			supports: {
				spacing: { padding: true, margin: true },
				typography: {
					fontSize: true,
					__experimentalDefaultControls: { fontSize: true },
				},
			},
		} );
		expect(
			settings.supports.spacing.__experimentalDefaultControls
		).toEqual( { padding: true } );
		expect(
			settings.supports.typography.__experimentalDefaultControls
		).toEqual( { fontSize: true } );
		expect( settings.supports.__experimentalBorder ).toBeUndefined();
	} );

	it( 'leaves blocks without supports alone', () => {
		const settings = { title: 'Plain' };
		expect( openDefaultControls( settings ) ).toBe( settings );
	} );

	it( 'ignores supports declared as booleans', () => {
		const settings = { supports: { spacing: true } };
		expect( openDefaultControls( settings ).supports.spacing ).toBe( true );
	} );
} );
