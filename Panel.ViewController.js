/*
	Panel View Controller
	
	keeps track of the open panels and shows/hides overlay
*/
Panel.ViewController = Backbone.View.extend({

	attributes: {
		'id': '_panel' // we use an underscore so we don’t override the existing jQuery Panel plugin
	},
	
	template: $('#template-panel-controller').html(),
	
	panels: [], // stores open panels
	
	initialize: function(){
	
		$('body').append( this.el );
		
		this.$el.html( this.template ).hide();
		
		this.$overlay = this.$el.find('.panel-overlay');
		this.$panels = this.$el.find('.panel-outer');
		
		// when the window is resized, resize all the open panels
		$(window).resize( _.bind(this.resize, this) );
	},
	
	showOverlay: function(){
		this.$overlay.addClass('in');
	},
	
	hideOverlay: function(){
		this.$overlay.removeClass('in');
	},
	
	show: function(){
		this.$el.show();
	},
	
	hide: function(){
		this.$el.hide();
	},
	
	addPanel: function(panel){
	
		// if no existing panels, lets show the overlay and set body class
		if( this.panels.length == 0 ){
		
			this.show(); // show panel wrapper

			_.defer(_.bind(this.showOverlay, this)); // show overlay (defer so css fade will work)
			
			$('body').addClass('_panel-open'); // set body class in case 
		}
		
		// add panel to DOM, and render it
		this.$panels.append( panel._render().el );
		
		// store reference to panel and set panel index
		panel.index = this.panels.push( panel ) - 1;
		
		// listen for events on this panel
		panel.on('close', this.closePanel, this)
		panel.on('close-under', this.closeUnder, this);
		
		// set width of controller view
		this.setWidth();
		
	},
	
	/*
		Close a Panel - the controller does this because there may be panels on top that also need to be closed
	*/
	closePanel: function(panel){
		
		// get index and array of panels to remove
		var indx = panel.index;
		var removePanels = _.rest(this.panels, indx);
		
		// remove each panel
		_.each( removePanels, _.bind(function(_panel, indx){
			
			// stop listening for events on this panel
			panel.off('close', this.closePanel);
			panel.off('close-under', this.closeUnder);
			
			_panel.index = null; // reset index
			_panel._close();	 // tell panel to close itself
			
		},this));
		
		// remove references to these panels
		this.panels.splice(indx, removePanels.length)
		
		// if view controller doesn't have any more panels, let hide it and remove body classes
		if( this.panels.length == 0 ){
			
			this.hideOverlay();
			
			$('body').removeClass('_panel-open');
			
			setTimeout(_.bind(this.hide, this), Panel.SPEED); // before hiding, allow for css animation to finish
		
		// else, set view controller width
		}else{
			this.setWidth();
		}
	},
	
	// clicked panel underneath current
	closeUnder: function(e, panel){
	
		var mouseX = e.pageX - panel.$el.offset().left;	// get mouse position relative to left side of panel
		var indx = Math.ceil( mouseX / Panel.PAD );		// each panel is separated by 25px, so figure out which panel indx the mouse clicked on
		
		// if the clicked index is not the same as this panel, then go ahead to close all panels starting at the index
		if(indx <= panel.index)
			this.panels[indx].close()
	},
	
	// set width of the view controller to the same width as the active (topmost) panel
	setWidth: function(){
		
		if( this.panels.length == 0 ) return;
		
		var activePanel = _.last(this.panels);
		
		this.$panels.width( activePanel.w +'px' );
		
	},
	
	// triggers resize on all open panels
	resize: function(){
	
		if( this.panels.length == 0 ) return;
		
		_.each( this.panels, function(panel){ panel.resize(); })	
	}
	
	
})

// initialize panel view controller when DOM is ready
$(function() {

	panel.viewController = new Panel.ViewController();

});