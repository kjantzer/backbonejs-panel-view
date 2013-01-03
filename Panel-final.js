/*
	Panel.js - a slick panel view that slides out from the right side
	
	@author Kevin Jantzer, Blackstone Audio
	@since 2013-01-02
	@orig-code 2012-05-22
	
*/
var Panel = {};
var panel = {};

Panel.SPEED	= 300;		// keep in sync with CSS
Panel.PAD	= 25;		// keep in sync with CSS
Panel.TOP_H	= 50;		// height of top title


// @codekit-append 'Panel.ViewController.js'
// @codekit-append 'Panel.View.js'

/* **********************************************
     Begin Panel.ViewController.js
********************************************** */

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

/* **********************************************
     Begin Panel.View.js
********************************************** */

/*
	Panel View
	
	this.init - hook into the intialize process
	
	this.render - fn - set the panel content (this.$content)
	this.toolbar - fn - set a toolbar 
	this.footer - fn, string, array - set the footer
		
		fn that returns html
		array for a list of buttons
			[ {label: 'Button Title', className: 'blue save-it'}]
		string - speciality shortcut - use "close" to automatically add a close button
		
	
	If toolbar or footer is not set, they will be hidden
	
*/
Panel.View = Backbone.View.extend({

	tagName: 'li',
	
	//className: 'panel-item',
	
	title	: '',	// title of panel
	icon	: '',	// title icon ("icon-" is added so "user" will be "icon-user")
	w		: 600,	// width
	
	template: $('#template-panel-view').html(),
	
	defaultEvents: {
		'click': 'closeUnder',						 // look for clicks on panels underneath
		'click .panel-close': 'close',				 // "x" close button in header
		'click .panel-footer .button.close': 'close' // close button in the footer
	},
	
	initialize: function(opts){
	
		this.events = _.extend({}, this.events||{}, this.defaultEvents);
		
		this.$el.html( this.template ).addClass('panel-item');
		
		this.$title = this.$el.find('.panel-title');
		this.$toolbar = this.$el.find('.panel-toolbar');
		this.$content = this.$el.find('.panel-content');
		this.$footer = this.$el.find('.panel-footer');
		
		this.setWidth();
		this.setTitle();
		this.setIcon();
		
		if( !this.toolbar )
			this.$toolbar.hide();
		
		if( !this.footer )
			this.$footer.hide();
			
		if( this.init )
			this.init();
	},
	
	_render: function(){
	
		this.$toolbar.html('');
		this.$footer.html('');
		
		this.render();
		this._toolbar();
		this._footer();
		
		this.delegateEvents();
		
		return this;	
	},
	
	_toolbar: function(){
		if( this.toolbar )
			this.$toolbar.append( this.toolbar() );	
	},
	
	footer: 'close', // default footer is a close button
	
	_footer: function(){		
		
		if( !this.footer ) return;
		
		// if footer is "close", add a close button
		if( this.footer === 'close' ){
			this.$footer.append( this.footerBtn('close') );	
			
			
		// if an array, create buttons for each array item
		}else if( _.isArray( this.footer ) ){
			
			_.each(this.footer, _.bind(function(btnOpts){
				this.$footer.append( this.footerBtn(btnOpts) );	
			},this))
		
		// string or jQuery object
		}else if( _.isString(this.footer) || _.isObject(this.footer) ){
			this.$footer.append( this.footer );	
		
		// function that returns html
		}else{
			this.$footer.append( this.footer() );	
		}
	},
	
	footerBtn: function(opts){
	
		if( opts === 'close' )
			opts = {label: 'Close', className: 'white close right'};
	
		opts = _.extend({
			label: 'Button',
			className: 'white'
		}, opts);
		
		return $('<a class="button '+opts.className+'">'+opts.label+'</a>');
	},
	
	/*
		Open - the panel.
	*/
	open: function(){
		
		// if we have a panel index, then this panel has already been added and opened
		if( this.panelIndex )
			return;
		
		// add this panel to the view controller
		panel.viewController.addPanel(this);
		
		this.trigger('opening', this)
		
		// we use defer to make sure the view controller has added us to the DOM
		_.defer(_.bind(function(){
			
			this.$el.addClass('in'); // slide in the panel
			this.resize(); // trigger a content resize				
			
			setTimeout(_.bind(function(){
				
				this.trigger('opened', this)
				
			}, this), Panel.SPEED);
			
			
		},this))
	},
	
	// tell the view controller we want to close
	close: function(){
		this.trigger('close', this);
	},
	
	/*
		Close the panel - this is called by the panel view controller
	*/
	_close: function(){
		
		this.$el.removeClass('in');
		
		this.trigger('closing', this);
		
		// after hiding, we destroy the DOM panel
		setTimeout(_.bind(function(){
			
			this.$el.remove();
			
			this.trigger('closed', this);
			
		},this), Panel.SPEED); 
	},
	
	// close panels underneath - if a user clicks on the edge of a panel that is underneath
	closeUnder: function(e){
		this.trigger('close-under', e, this); // the panel view controller will take care of the rest
	},
	
	/*
		Set Width of panel
	*/
	setWidth: function(){
		this.$el.width( this.w );
	},
	
	/*
		Set Title of panel
	*/
	setTitle: function(newTitle){
	
		if( newTitle ) this.title = newTitle;
	
		this.$title.html(this.title).attr('title', this.title);
	},
	
	/*
		Set Icon of panel
	*/
	setIcon: function(newIcon){
	
		this.$title.removeClass('icon-'+this.icon)
		
		if( newIcon ) this.icon = newIcon;
	
		this.$title.addClass('icon-'+this.icon)
	},
	
	
	/*
		Resize - the center content to keep scrolling working - adjusts for top header, toolbar, and footer (if any)
	*/
	resize: function(){
		
		var bodyH = $('body').height();
		var outerH = Panel.TOP_H + this.toolbarH() + this.footerH();
		
		var h = bodyH - outerH;
			
		this.$content.css('height',h);
		
	},
	
	// get toolbar height - returns 0 if no toolbar is set
	toolbarH: function(){
		return this.toolbar ? this.$toolbar.outerHeight() : 0;
	},
	
	// get footer height - returns 0 if no footer is set
	footerH: function(){
		return this.footer ? this.$footer.outerHeight() : 0;
	},
	
	/*
		Show and Hide Spinner - displays on the toolbar
	*/
	spin: function(doSpin){
	
		_.defer( _.bind(function(){
			
			if(doSpin !== false)
				this.$toolbar.spin('small')
			else
				this.$toolbar.spin(false)
			
		},this))
	}
	
})