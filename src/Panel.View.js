/*
	Panel View
	
	this.render - fn - set the panel content (this.$content)
	this.toolbar - fn - set a toolbar 
	this.footer - fn, string, array - set the footer
		
		fn that returns html
		array for a list of buttons
			[ {label: 'Button Title', className: 'primary save-it'}]
		string - speciality shortcut - use "close" to automatically add a close button
		
	
	If toolbar or footer is not set, they will be hidden
	
*/
Panel.View = Backbone.View.extend({

	tagName: 'li',
	
	//className: 'panel-item',
	//_view: function(){ return new Backbone.View(); }, // if this is set, it will append this view to the content
	
	title	: '',	// title of panel
	icon	: '',	// title icon ("icon-" is added so "user" will be "icon-user")
	w		: 600,	// width
	
	_template: $('#template-panel-view').html(),
	
	defaultEvents: {
		'click': 'closeUnder',						 // look for clicks on panels underneath
		'click .panel-close': 'close',				 // "x" close button in header
		'click .panel-footer .button.panel-close': 'close' // close button in the footer
	},
	
	constructor: function(data, opts){
	
		// if the initialize method has been overridden, patch it to make sure Panel.View.initialize is called first
		if( this.initialize != Panel.View.prototype.initialize ){
			
			var that = this;
			var init = this.initialize; // cache the override method
			
			this.initialize = function(){
				Panel.View.prototype.initialize.apply(that, arguments) // call real initialize first
				init.apply(that, arguments); // then we can call the override initalize
			}
		}
		
		// call normal backbone constructor
		Backbone.View.prototype.constructor.call(this, data);
	},
	
	// this method will be called no matter what, even if it is overridden
	initialize: function(opts){
	
		this.events = _.extend({}, this.events||{}, this.defaultEvents);
		
		this.$el.html( this._template ).addClass('panel-item');
		
		this.$header	= this.$('.panel-header');
		this.$title		= this.$('.panel-title');
		this.$toolbar	= this.$('.panel-toolbar');
		this.$content	= this.$('.panel-content');
		this.$footer	= this.$('.panel-footer');
		
		this.setWidth();
		this.setTitle();
		this.setIcon();
		
		if( !this.toolbar )
			this.$toolbar.hide();
		
		if( !this.footer )
			this.$footer.hide();
		
		if( this._view ){
			this.view = _.isString(this._view) ? new (_.getObjectByName(this._view))() : this._view();
			this.view.on('panel:close', this.close, this);
			this.$content.append( this.view.el );
		}
		
		if( this.init )
			this.init();
	},
	
	_render: function(){
	
		this.render();
		this._toolbar();
		this._footer();
		
		this.delegateEvents();
		
		return this;	
	},
	
	render: function(){
		if( this.view && this.view instanceof Backbone.View )
			this.view.render();
	},
	
	_toolbar: function(){
		
		this.$toolbar.html('');
		
		if( this.toolbar )
			this.$toolbar.append( this.toolbar() );	
	},
	
	footer: 'close', // default footer is a close button
	
	_footer: function(){		
		
		this.$footer.html('');
		
		if( !this.footer ) return;

		//if a function set this.footer to the return 
		if( _.isFunction(this.footer) )
			this.footer = this.footer();
		
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
	
		if( _.isFunction(opts) )
			opts = opts.call(this);
	
		if( opts === 'close' )
			opts = {label: 'Close', className: 'white panel-close right'};
		else if( opts === 'cancel' )
			opts = {label: 'Cancel', className: 'white panel-close right'};
	
		opts = _.extend({
			label: 'Button',
			className: 'white'
		}, opts);
		
		return $('<a class="button btn btn-default '+opts.className+'">'+opts.label+'</a>');
	},
	
	/*
		Open - the panel.
	*/
	open: function(){
		
		// if we have a panel index, then this panel has already been added and opened
		if( this.index !== null && this.index >= 0 ){
			this._render()
			panel.viewController.closeAbove(this)
			return;
		}
		
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
		this.$content.width( this.w );
	},
	
	/*
		Set Title of panel
	*/
	setTitle: function(newTitle){
	
		if( newTitle ) this.title = newTitle;
	
		this.$title.html(this.title).attr('title', _.stripTags(this.title));
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
		
		var bodyH = $(window).height();
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
				this.$header.spin('small', null, false)
			else
				this.$header.spin(false)
			
		},this))
	},
	
	clearContent: function(){
		this.$content.html('');
	},
	
	append: function(content){
		this.$content.append(content);
	}
	
})