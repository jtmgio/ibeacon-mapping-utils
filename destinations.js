;(function( app, $ ) {
"use strict";
/*
** library - MPDestinations
** desc - this will write out the destinaion markers on the maps
*/
app.MPDestinations = function( options ){	
	var root;
	root = this;	

	//public accessible vars
	return {
		writeMapMarkers : fnWriteMapMarkers,
		setMapDimensions : fnSetMapDimensions,
		clearMarkers : fnClearMarkers
	};	
//================================================================================//
//=========  public methods  =====================================================//
//================================================================================//
	/*
	** method - fnClearMarkers
	** desc - this method will clear the markers
	*/
	function fnClearMarkers( elem ){
		elem.empty();
		return root;
	}
	/*
	** method - fnWriteMapMarker 
	** desc - this will write out the map markers
	*/	
	function fnWriteMapMarkers( map_attributes ){		
		var promise;
		
		//deferred for the library
		root.root_dfd = $.Deferred();
		//get the floor map for the browser
		promise = fnGetFloorMap({
			floor : map_attributes.map_data.floor,
			category : map_attributes.category,
			img_src : map_attributes.map_img_src,
			img_name : getMapImageName( map_attributes.map_img_src ),
			width : root.width,
			height : root.height
		});

		//on done lets setup the map markers		
		promise.done( setupMapMarkers.bind( map_attributes ) );
		
		//return the promise
		return root.root_dfd.promise();
	}
	/*
	** method - fnSetMapDimensions 
	** desc - this will set up all of the map dimensions HxW
	*/
	function fnSetMapDimensions( width, height ){
		root.width = width || 0;
		root.height = height || 0;
		return root;
	}
//================================================================================//
//=========  private methods  ====================================================//
//================================================================================//
	/*
	** method - setupMapMarkers
	** desc -
	*/
	function setupMapMarkers( ret ){
		var promise;
		//check to see if we have the api path set
		if( _.isUndefined( root.api_path ) ){			
			root.api_path = getAPIPath( this.map_img_src );
		}			
		//create the new image from the original to get the 
		//original height/width
		promise = createNewMapImage.call( this, ret, root.api_path );
		
		//once the image has loaded we can now set the original dimensions
		promise.done( renderMarkers.bind( this, ret ) );
	}
	/*
	** method - renderMarkers
	** desc -
	*/
	function renderMarkers( data, original_dimensions ){
		var map_points, template;
		//if the image hasn't yet changed lets not change the original source
		if( this.map_img_src != data.img ){
			this.map_img.attr( "src", data.img );
		}
		
		//set the map points
		map_points = getMapPoints( data.destinations, original_dimensions );
		
		//empty the locations container
		this.location_wrapper.empty();

		//get the main template
		template = _.template( fnGetImageWrapperTemplate() )({
			floor: this.map_data.floor,
			src : data.img
		});

		//write the new iamge
		this.location_wrapper.html( template );
		
		//write the map markers on the main image
		//set the root data jqx
		root.taggd = this.location_wrapper
			.find( "#main-floor-image" )
			.taggd( getTaggerOptions(), map_points );

		//we have finished every thing			
		root.root_dfd.resolve( root );		
		
		return root;
	}
	/*
	** method - getTaggerOptions
	** desc -
	*/	
	function getTaggerOptions(){
		//setup options for tagger
		return { 
			align: { y: 'center', x : 'center' },
			offset: {top: 0 },		
			handlers: { 
				click : clickHandler,
				mousedown : clickHandler,
				touchstart : clickHandler
				
			}
		};	
		/*
		** method - clickHandler 
		** desc - this is the click handler for the 
		*/
		function clickHandler( vent ){
			$(  ".taggd-wrapper .taggd-item-hover" ).css({ 'opacity': 0, 'z-index' : 999 });
			var $wrapper = $( this ).next().css({ 'opacity': 1, 'z-index' : 9999 });
			var location = $( this ).data( "location" );
			$wrapper.html( 
				_.template( fnGetPointsTemplate() )({
					location : location
				})
			);
	        $( "#location-item-wrap" ).scrollTo( 
	        	$( "div#" + location + "-scroll" )  
	        );
	        vent.stopImmediatePropagation();

		}
	}
	/*
	** method - getMapPoints
	** desc -
	*/
	function getMapPoints( destinations, original_dimensions ){
		return _.compact(
			_.map( destinations, function( item ){
				if( item.mp_destinations.count == 0 ){
					return undefined;
				}
				return {
					x : item.x / original_dimensions.width,
					y : item.y / original_dimensions.height,
					text : item.mp_destinations.data[ 0 ].location,
					attributes : {
						'data-location' : replaceSpacesInLocationName( item.mp_destinations.data[ 0 ].location, "-" )
					}
				};
			})
		);	
	}
	/*
	** method - removeSpaces
	** desc - this will remove all of the spaces 
	*/
	function replaceSpacesInLocationName( string, deliminator ){
		return (
			string.toLowerCase().split( " " ).join( deliminator )
		);
	}
	/*
	** method - createNewMapImage 
	** desc - this will get the original h/w
	*/
	function createNewMapImage( data, api_path ){
		var tmp_image, dfd = $.Deferred();
		tmp_image = new Image();
		tmp_image.src = api_path + getMapImageName( data.img );
		tmp_image.onload = function(){
			dfd.resolve({
				height : this.height,
				width : this.width
			});
		}
		return dfd.promise();
	}
	/*
	** method - getAPIPath
	** desc - this will get the path to the api 
	*/
	function getAPIPath( src ){
		return (
			src.split( "/" ).slice( 0, -1 ).join( "/" ) + "/"
		);
	}
	/*
	** method - fnGetFloorMap
	** desc - this will get the floor map
	*/
	function fnGetFloorMap( data ){
		return $.ajax({
			url : "/index.cfm?action=locations.getFloorMapForBrowser",
			type : "POST",
			data : data
		});
	}
	/*
	** method - getMapImageName 
	** desc - this will get the name of the image from the source
	*/
	function getMapImageName( src ){
		return (
			_.last( src.split( "/" ) ) || ""
		);
	}
//================================================================================//
//=========  js templates  =======================================================//
//================================================================================//
	/*
	** method - fnSetMapDimensions 
	*/
	function fnGetPointsTemplate(){
		return '\
		<div>\
			<%= _.startCase( location ) %><br />\
			<a href="/index.cfm?action=locations.detail&location=<%= location %>" data-scrollto="<%= location %>">Details</a>\
		</div>';
	}
	/*
	** method - fnSetMapDimensions 
	*/
	function fnGetImageWrapperTemplate(){
		return '\
			<div class="whiteout"></div>\
			<a id="more-map-view-btn" >\
				<img src="/assets/img/icons-v2/map-icons/stairs-transparent-gray-button.png" alt="">\
			</a>\
			<span id="main-floor-image-wrapper" class="pan-zoom">\
				<img id="main-floor-image" crossOrigin="Anonymous" data-floor="<%= floor %>" src="<%= src %>" class="img-responsive" />\
			</span>\
		';	
	}
}
}( MP.app, jQuery ));