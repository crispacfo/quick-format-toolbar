/**
 * Settings, opened from the editor's ⋮ menu. Stored per user in core/preferences.
 * Button width, which tools to show (in a fixed order), and the experimental
 * Inspector Shortcuts. Where the toolbar shows is the editor's own "Top toolbar".
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	Button,
	CheckboxControl,
	Modal,
	RadioControl,
} from '@wordpress/components';

import {
	DEFAULTS,
	INSPECTOR_CONTROLS,
	SCOPE,
	usePreference,
} from '../preferences';
import { TOOLS, TOOL_ORDER } from '../toolbar/tools';

const INSPECTOR_LABELS = {
	padding: __( 'Padding', 'estudobiblico-quick-format-toolbar' ),
	margin: __( 'Margin', 'estudobiblico-quick-format-toolbar' ),
	blockGap: __( 'Block spacing', 'estudobiblico-quick-format-toolbar' ),
	lineHeight: __( 'Line height', 'estudobiblico-quick-format-toolbar' ),
	border: __( 'Border', 'estudobiblico-quick-format-toolbar' ),
	radius: __( 'Radius', 'estudobiblico-quick-format-toolbar' ),
};

function toggle( list, item, on ) {
	return on
		? [ ...list.filter( ( entry ) => entry !== item ), item ]
		: list.filter( ( entry ) => entry !== item );
}

function ToolChecklist( { group, enabled, setEnabled } ) {
	return TOOL_ORDER.filter( ( id ) => TOOLS[ id ].group === group ).map(
		( id ) => (
			<CheckboxControl
				key={ id }
				__nextHasNoMarginBottom
				label={ TOOLS[ id ].label }
				checked={ enabled.includes( id ) }
				onChange={ ( on ) => setEnabled( toggle( enabled, id, on ) ) }
			/>
		)
	);
}

export default function SettingsModal( { onClose } ) {
	const [ tools, setTools ] = usePreference( 'tools' );
	const [ density, setDensity ] = usePreference( 'density' );
	const [ inspectorEnabled, setInspectorEnabled ] =
		usePreference( 'inspectorEnabled' );
	const [ inspector, setInspector ] = usePreference( 'inspectorShortcuts' );
	const { set } = useDispatch( preferencesStore );

	return (
		<Modal
			title={ __(
				'EstudoBiblico Quick Format Toolbar',
				'estudobiblico-quick-format-toolbar'
			) }
			onRequestClose={ onClose }
			className="qft-settings"
			size="medium"
		>
			<RadioControl
				label={ __(
					'Button width',
					'estudobiblico-quick-format-toolbar'
				) }
				help={ __(
					'The height comes from the editor’s toolbar; every button is clickable over its whole area.',
					'estudobiblico-quick-format-toolbar'
				) }
				selected={ density }
				options={ [
					{
						label: __(
							'Compact',
							'estudobiblico-quick-format-toolbar'
						),
						value: 'compact',
					},
					{
						label: __(
							'Normal',
							'estudobiblico-quick-format-toolbar'
						),
						value: 'normal',
					},
					{
						label: __(
							'Comfortable',
							'estudobiblico-quick-format-toolbar'
						),
						value: 'comfortable',
					},
				] }
				onChange={ setDensity }
			/>

			<h2 className="qft-settings__heading">
				{ __( 'Text tools', 'estudobiblico-quick-format-toolbar' ) }
			</h2>
			<p className="qft-settings__help">
				{ __(
					'Shown after the editor’s own bold, italic and link buttons. To keep the toolbar at the top of the screen, use the editor’s “Top toolbar” option.',
					'estudobiblico-quick-format-toolbar'
				) }
			</p>
			<ToolChecklist
				group="inline"
				enabled={ tools }
				setEnabled={ setTools }
			/>

			<h2 className="qft-settings__heading">
				{ __( 'Block tools', 'estudobiblico-quick-format-toolbar' ) }
			</h2>
			<p className="qft-settings__help">
				{ __(
					'The editor already offers these in its own menus; turn them on for one-click access.',
					'estudobiblico-quick-format-toolbar'
				) }
			</p>
			<ToolChecklist
				group="block"
				enabled={ tools }
				setEnabled={ setTools }
			/>

			<h2 className="qft-settings__heading">
				{ __( 'Experimental', 'estudobiblico-quick-format-toolbar' ) }
			</h2>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __(
					'Inspector Shortcuts',
					'estudobiblico-quick-format-toolbar'
				) }
				help={ __(
					'Shows some dimension, typography and border controls directly in the sidebar, for blocks that support them, instead of behind “+”. Uses an experimental editor feature; takes effect after reloading the editor.',
					'estudobiblico-quick-format-toolbar'
				) }
				checked={ inspectorEnabled }
				onChange={ setInspectorEnabled }
			/>
			{ inspectorEnabled && (
				<div className="qft-settings__sub">
					{ INSPECTOR_CONTROLS.map( ( control ) => (
						<CheckboxControl
							key={ control }
							__nextHasNoMarginBottom
							label={ INSPECTOR_LABELS[ control ] }
							checked={ inspector.includes( control ) }
							onChange={ ( on ) =>
								setInspector( toggle( inspector, control, on ) )
							}
						/>
					) ) }
				</div>
			) }

			<div className="qft-settings__footer">
				<Button
					variant="tertiary"
					onClick={ () =>
						Object.keys( DEFAULTS ).forEach( ( name ) =>
							set( SCOPE, name, DEFAULTS[ name ] )
						)
					}
				>
					{ __(
						'Reset to defaults',
						'estudobiblico-quick-format-toolbar'
					) }
				</Button>
				<Button variant="primary" onClick={ onClose }>
					{ __( 'Done', 'estudobiblico-quick-format-toolbar' ) }
				</Button>
			</div>
		</Modal>
	);
}
