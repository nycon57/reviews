( function ( wp ) {
	var registerBlockType = wp.blocks.registerBlockType;
	var el                = wp.element.createElement;
	var useBlockProps     = wp.blockEditor.useBlockProps;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var PanelBody         = wp.components.PanelBody;
	var TextControl       = wp.components.TextControl;
	var Placeholder       = wp.components.Placeholder;
	var ServerSideRender  = wp.serverSideRender || wp.components.ServerSideRender;

	registerBlockType( 'repwell/widget', {
		edit: function ( props ) {
			var attributes    = props.attributes;
			var setAttributes = props.setAttributes;
			var blockProps    = useBlockProps();

			var inspectorPanel = el(
				InspectorControls,
				null,
				el(
					PanelBody,
					{ title: 'Widget Settings', initialOpen: true },
					el( TextControl, {
						label: 'Widget ID',
						help: 'The unique identifier for your RepWell widget.',
						value: attributes.widgetId,
						onChange: function ( val ) { setAttributes( { widgetId: val } ); },
					} ),
					el( TextControl, {
						label: 'Width',
						help: 'Optional. E.g., "600px" or "100%".',
						value: attributes.width,
						onChange: function ( val ) { setAttributes( { width: val } ); },
					} ),
					el( TextControl, {
						label: 'Min Height',
						help: 'Optional. E.g., "400px".',
						value: attributes.height,
						onChange: function ( val ) { setAttributes( { height: val } ); },
					} )
				)
			);

			// If no widget ID is set, show a placeholder prompting input.
			if ( ! attributes.widgetId ) {
				return el(
					'div',
					blockProps,
					inspectorPanel,
					el(
						Placeholder,
						{
							icon: 'star-filled',
							label: 'RepWell Widget',
							instructions: 'Enter a widget ID to display a RepWell review widget.',
						},
						el( TextControl, {
							label: 'Widget ID',
							value: attributes.widgetId,
							onChange: function ( val ) { setAttributes( { widgetId: val } ); },
						} )
					)
				);
			}

			// Once a widget ID is set, render a server-side preview.
			return el(
				'div',
				blockProps,
				inspectorPanel,
				el( ServerSideRender, {
					block: 'repwell/widget',
					attributes: attributes,
				} )
			);
		},
	} );
} )( window.wp );
