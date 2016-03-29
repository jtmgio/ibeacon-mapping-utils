//library
;(function( window, app, undefined ) {
"use strict";
	var undefined;
	var cl =  console.log.bind( console );
	//lines
	var _line_width_ = 10;
	var _line_color_ = "rgb(0,0,255)";
	var _line_offset_ = 0;
	//points
	var _radians_ = Math.PI * 2;
	var _radius_ = 15;
	var _point_fill_color_ = "#000000";
	var _point_text_fill_color_ = "white";
	var _point_text_font_ = "12pt Arial";
	var _point_text_align_ = "left";
	//default options
	var default_options = {
		_line_width_ : _line_width_,
		_line_color_ : _line_color_,
		_line_offset_ : _line_offset_,
		_radians_ : _radians_,
		_radius_ : _radius_,
		_point_fill_color_ : _point_fill_color_,
		_point_text_fill_color_ : _point_text_fill_color_,
		_point_text_font_ : _point_text_font_,
		_point_text_align_ : _point_text_align_
	};
	var MPCanvasWriter = function( options ){
		var vm = this;
		vm.canvas = "";
		vm.map_image_src = "";
		vm.point_map = [];
		vm.map_image = "";		
		options = default_options;
		return {
			loadMapImage : fnLoadMapImage,
			createCanvas : fnCreateCanvas,
			getMapImage : fnGetMapImage
		}
		/*
		** method - fnLoadImage 
		** desc -
		*/		
		function fnLoadMapImage( map_image_src ){
			var promise;
			//set the image souce
			vm.map_image_src = map_image_src;
			//create the main canvas image
			vm.map_image = fnCreateImage();
			//load the image
			promise = fnLoadImage();
			//return promise			
			return promise;					
		}
		/*
		** method - fnCreateCanvas
		** desc - this will set the canvas
		*/
		function fnCreateCanvas( canvas, point_map ){
			var promise;
			vm.point_map = point_map;
			vm.canvas = canvas;
			promise = fnInitializeCanvas();
			return promise;									
		}
		/*
		** method - fnGetMapImage
		** desc - this will get the image map
		*/
		function fnGetMapImage(){
			return ( 
				vm.canvas.image_canvas.toDataURL( "image/png" )
			);			
		}
		/*
		** method - fnInitializeCanvas
		** desc - initiailer
		*/
		function fnInitializeCanvas(){
			var dfd = $.Deferred();
			fnSetCanvas( dfd );
			return dfd.promise();
		}
		/*
		** method - 
		** desc -
		*/
		function fnSetCanvas( dfd ){
			//set canvas height/width
			fnSetCanvasDimensions( vm.map_image.width, vm.map_image.height );
			fnDrawImage();
			_.each( vm.point_map, function( point, idx ){
				fnDrawPoints( idx, point.x, point.y );
				fnDrawLines( idx, vm.point_map );	
			}, this );
			fnCombineCanvases();
			dfd.resolve( "Finished writing canvas" );
		}
		/*
		** method - fnCombineCanvases
		** desc - this will combine layers
		*/
		function fnCombineCanvases(){
			var ctx;
			ctx = vm.canvas.image_canvas.getContext( "2d" );
			ctx.drawImage( vm.canvas.line_canvas, 0, 0 );				
			ctx.drawImage( vm.canvas.point_canvas, 0, 0 );				
			return this;			
		}
		/*
		** method - fnSetCanvasDimensions
		** desc - set the height of the canvas
		*/
		function fnSetCanvasDimensions( width, height ){
			_.each( vm.canvas, function( c, key ){
				vm.canvas[ key ].getContext( "2d" ).canvas.width = width;
				vm.canvas[ key ].getContext( "2d" ).canvas.height = height; 
			}, this );
			return this;			
		}
		/*
		** method - fnCreateImage
		** desc - this will create the image
		*/
		function fnCreateImage(){
			vm.map_image = new Image();
			vm.map_image.src = vm.map_image_src;
			vm.map_image.setAttribute('crossOrigin', 'anonymous');
			return vm.map_image;
		}
		/*
		** method - fnDrawImage
		** desc - this will draw the imaghe
		*/
		function fnDrawImage(){
			var ctx = vm.canvas.image_canvas.getContext( "2d" );
	    	var img_width = vm.map_image.width;
	    	var img_height = vm.map_image.height;
			ctx.drawImage( vm.map_image, 0, 0, img_height, img_width );
			return this;
		}
		/*
		** method - fnDrawLine
		** desc - this will draw lines and connect the points
		*/
		function fnDrawLines( index, points ){
			var Xa, Ya, Xb, Yb, set_1, set_2, ctx;
			//only do this for iterations greater than 0
			if( index == 0  ){
				return this;
			}
			ctx = vm.canvas.line_canvas.getContext( "2d" );
			//setup the points grid
			set_1 = points[ index - 1 ];
			set_2 = points[ index ];
			//start the drawing of lings		
			ctx.beginPath();
			ctx.moveTo( set_1.x, set_1.y );
			ctx.lineTo( set_2.x, set_2.y );
			//style the line
			ctx.lineWidth = options._line_width_;
			ctx.strokeStyle = options._line_color_;
			//write the line
			ctx.stroke();
			return this;
		}
		/*
		** method - fnDrawPoints
		** desc - this will draw the points
		*/
		function fnDrawPoints( point_num, x, y  ){
			var ctx;
			ctx = vm.canvas.point_canvas.getContext( "2d" );
			//draw a circle
			ctx.beginPath();
			//args are the following
			//centerX
			//centerY
			//radius
			//sAngle 0 degrees
			//eAngle x * PIE 3.14159
			//counterClockwise
			ctx.arc( x, y, options._radius_, 0, options._radians_, true ); 
			ctx.fillStyle = options._point_fill_color_;
			ctx.closePath();
			ctx.fill();	
	
	        ctx.font = options._point_text_font_;
	        ctx.fillStyle = options._point_text_fill_color_;
	        ctx.textAlign = options._point_text_align_;
	        ctx.fillText( point_num + 1, x - options._radius_/4, y + 3 );		
		}
		/*
		** method - fnLoadImage
		** desc - this will load the image with a deferred object
		*/
		function fnLoadImage(){
			var dfd;
			//create the deferred
			dfd = $.Deferred();
			//load the image and resolve
			vm.map_image.onload = function(){
				dfd.resolve( "Image has been loaded" );
			};
			//return the defered
			return dfd.promise();
		}
	}
	//bind to window
	app.MPCanvasWriter = MPCanvasWriter;
}( typeof window === 'undefined' ? this : window, MP.app ));