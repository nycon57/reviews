( function () {
	tinymce.PluginManager.add( 'repwell_insert_widget', function ( editor ) {
		editor.addButton( 'repwell_insert_widget', {
			title: 'Insert RepWell Widget',
			icon: 'icon dashicons-star-filled',
			onclick: function () {
				editor.windowManager.open( {
					title: 'Insert RepWell Widget',
					body: [
						{
							type: 'textbox',
							name: 'widgetId',
							label: 'Widget ID',
							tooltip: 'The unique identifier for your RepWell widget.',
						},
						{
							type: 'textbox',
							name: 'width',
							label: 'Width (optional)',
							tooltip: 'E.g., "600px" or "100%".',
						},
						{
							type: 'textbox',
							name: 'height',
							label: 'Min Height (optional)',
							tooltip: 'E.g., "400px".',
						},
						{
							type: 'textbox',
							name: 'cssClass',
							label: 'CSS Class (optional)',
						},
					],
					onsubmit: function ( e ) {
						var id = e.data.widgetId;
						if ( ! id ) {
							editor.windowManager.alert( 'Widget ID is required.' );
							return;
						}

						var shortcode = '[repwell_widget id="' + id + '"';
						if ( e.data.width ) {
							shortcode += ' width="' + e.data.width + '"';
						}
						if ( e.data.height ) {
							shortcode += ' height="' + e.data.height + '"';
						}
						if ( e.data.cssClass ) {
							shortcode += ' class="' + e.data.cssClass + '"';
						}
						shortcode += ']';

						editor.insertContent( shortcode );
					},
				} );
			},
		} );
	} );
} )();
