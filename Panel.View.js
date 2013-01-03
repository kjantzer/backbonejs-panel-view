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