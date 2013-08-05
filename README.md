BackboneJS: Panel View
=====================

Sliding panel views that stack. Complete with optional toolbar and footer. Automatically resizes when window size changes.

![Preview](http://i.imgur.com/5q5IF5u.png)

## Requires
* LESS CSS
* Elements.less
* CodeKit


## Use

Add this in your `<head>` tag

	<!-- Panel View Controller -->
	<script id="template-panel-controller" type="text/html">
	<div class="panel-overlay"></div>
	<ul class="panel-outer"></ul>
	</script>

	<!-- Panel View -->
	<script id="template-panel-view" type="text/html">
	<div class="panel-inner">
		
		<div class="panel-header">
			<div class="panel-close"></div>
			<h3 class="panel-title"></h3>
		</div>
		
		<div class="panel-toolbar clearfix"></div>
		<div class="panel-content"></div>
		<div class="panel-footer clearfix"></div>
	
	</div>
	</script>
	<script src="Panel/Panel-final.js" type="text/javascript"></script>
	
Then create your panel(s)

    var MyPanel = Panel.View.extend({
	
	    title: 'My Panel',
	    w: 400,
	    
	    render: function(){
	        this.$content.html('Content here');
	    },
	    
	    footer: 'This text will show in the footer. Set footer:false for no footer, or use a function to return something more dynamic'
	
    });
    
	myPanel = new MyPanel();
	
	myPanel.open()