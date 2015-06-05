/** Data model
  * Locations for the map
  * to be populated via the Foursquare API
  */
var Model = {
	locations: ko.observableArray()
};

/** ViewModel creates the Google Map,
  * ajax call Foursquare API and push 'venue' objects to 'locations' array;
  * Create marker on map for each 'location'
  */

var apiURL = "https://api.foursquare.com/v2/venues/explore?mode=url&near=Ponsonby%2C%20Auckland&cat=drinks&limit=15&radius=1000&client_id=245EPMAL2DZV51ZNELQKUKTATUNFROARMPWDZSY0EJORPZJH&client_secret=%20KRJZSM1N3AVO2IOSXZC3NAWC1MN4VO3CU1525MYGXXQYEQUS&v=20130815";
var foursquarelogo = "https://ss0.4sqi.net/img/poweredByFoursquare/poweredby-full-color-bf549c16c0ab3e1b04706ab5fcb422f1.png";
var foursquareicon = "https://playfoursquare.s3.amazonaws.com/press/2014/foursquare-logomark.png";
var streetviewurl = "https://maps.googleapis.com/maps/api/streetview?size=180x120&fov=90&heading=235&pitch=0&location=";

var ViewModel = function() {
	var self = this;
	var map, bounds, infowindow; // initialize the required variables for Google map

  self.apiUnavailable = ko.observable(false);

	/** Initialize map and create map markers and push them to the Model.
	  */
    var initialize = function() {
		/** error check, if google maps is available
	      * http://stackoverflow.com/questions/9228958/how-to-check-if-google-maps-api-is-loaded
  		  */

  		var mapOptions = {
          disableDefaultUI: true,
          mapTypeId: google.maps.MapTypeId.TERRAIN
        };
      // map = new google.maps.Map(document.getElementsByClassName('map-canvas'), mapOptions);
      map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
      bounds = new google.maps.LatLngBounds();
      infowindow = new google.maps.InfoWindow({
        content: null
      });
      // verify that we have a map object to work with
	    if(typeof window.google === 'object' && typeof window.google.maps === 'object') {
		    // ajax call
        // get the data from the 3rd party API
        $.getJSON(apiURL, function(data) {
	        var items = data.response.groups[0].items;
	        //console.log(items);
	        items.sort(function(a,b){ // sort by name ascending http://www.javascriptkit.com/javatutors/arraysort2.shtml
		        var nameA=a.venue.name.toLowerCase(), nameB=b.venue.name.toLowerCase();
  					if(nameA < nameB) return -1;
  					if(nameA > nameB) return 1;
  					return 0;
			    });
  				// create marker objects populated with 3rd party api data
  				var itemsLength = items.length;
  		        for (var i = 0; i < itemsLength; i++) {
		            var coordinates = new google.maps.LatLng(items[i].venue.location.lat, items[i].venue.location.lng);
		            // construct a string containing the title, category and address of the location
		            // user input 'restaurant' will produce results even if not in the title of the location
		            var searchblob = myUtils.convert_accented_characters(items[i].venue.name) + " " +
		            myUtils.toFriendlyString(items[i].venue.location.address) + " " +
		            myUtils.convert_accented_characters(myUtils.toFriendlyString(items[i].venue.categories[0].name));
		            var marker = new google.maps.Marker({ // populate the marker attributes
		              position: coordinates,
		              map: map,
		              title: items[i].venue.name,
		              searchblob: searchblob,
		              streetview: streetviewurl + coordinates,
		              phone: myUtils.toFriendlyString(items[i].venue.contact.phone),
		              phone_formatted: myUtils.toFriendlyString(items[i].venue.contact.formattedPhone),
		              url: myUtils.toFriendlyString(items[i].venue.url),
		              highlight: ko.observable(false), //boolean
		              rating: myUtils.toFriendlyString(items[i].venue.rating),
		              address: myUtils.toFriendlyString(items[i].venue.location.address),
		              category: myUtils.toFriendlyString(items[i].venue.categories[0].name)
		        	   });

                /** add event listener for each marker
      					  * compile content for infoWindow
      					  */
                google.maps.event.addListener(marker, 'click', function() {
      						var self = this;
      						self.setAnimation(google.maps.Animation.DROP);
      						infowindow.setContent("<h5><span class=\"label label-primary\">" + self.category +"</span>" + "&nbsp;"+
      							"<span class=\"label label-default\">" + self.rating +"</span></h5><h4>" + self.title + "</h4>" +
      							"<p>" + self.address + "</p>" + "<p><a href=tel:" + self.phone + ">" + self.phone_formatted + "</a></p>" +
      							"<p><a href=" + self.url + ">" + self.url + "</a></p>" +
      							"<p><img src='"+foursquarelogo+"'alt='foursquare' width='200'></p>" +
      							"<p><img src='"+self.streetview+"'alt='foursquare'></p>");
      
      						// open infoWindow and clear markers
      						infowindow.open(map, self);
      						clearHighlight();
      
      						// Modify marker (and list) to show selected status.
      						self.highlight(true);
      
      						// Move map viewport to center selected item.
      						map.panTo(self.position);
      						map.panBy(0,-140);
    			      }); // END google.maps.event.addListener(marker, 'click', function ()
    
    			        /** click event to close infowindow
    			          * This function will clear the selected location
    			          */
    			        google.maps.event.addListener(infowindow, 'closeclick', function() {
    			          clearHighlight();
    			        });
    
    			        // Modify map to show all markers
    			        bounds.extend(coordinates);
    
    			        //Add marker to array
    			        Model.locations.push(marker);

		            } // END for loop

        			map.fitBounds(bounds);
        			map.setCenter(bounds.getCenter());
        
        }).fail(function(e) { // handle error in case we can't get the data from the API
    			    console.log('Could not get data from API!');
    			    self.apiUnavailable(true);
    			    $(".map-canvas").css({"display":"none"}); // clean UI
  		  });
  		    // END ajax call
  		    // else no google maps object found, display error message
      } else {
        self.apiUnavailable(true);
        $(".map-canvas").css({"display":"none"});
        }
    }(); // END initialize function

  	/** FILTER and return items that match query
  	 *  http://www.strathweb.com/2012/07/knockout-js-pro-tips-working-with-observable-arrays/
  	 */
  	self.filterText = ko.observable(''); // reset locations filter
  	function combiFilter(marker) {
  			return marker.searchblob.toLowerCase().indexOf(self.filterText().toLowerCase()) !== -1;
      }
      self.myFilteredResults = ko.computed(function() {
  	    return ko.utils.arrayFilter(Model.locations(), combiFilter);
      }).extend({ throttle: 500 });
  
  	/** Subscribing to the myFilteredResults changes will allow for showing or hiding
  	 * the associated markers on the map itself using Google Maps API
  	 */
      self.myFilteredResults.subscribe(function() {
        var difference = ko.utils.compareArrays(Model.locations(), self.myFilteredResults());
        ko.utils.arrayForEach(difference, function(marker) {
          if (marker.status === 'deleted') {
            marker.value.setMap(null);
          } else {
            marker.value.setMap(map);
          }
        });
      });
  
  	// Highlight map marker if list item is clicked.
  	self.selectItem = function(listItem) {
  		google.maps.event.trigger(listItem, 'click');
  	};
  
  	/** reset all markers, clear highlight in list
  	 */
  	function clearHighlight() {
  		for(var i = 0; i < Model.locations().length; i++) {
  			Model.locations()[i].highlight(false);
  		}
  	}
}; // END ViewModel

ko.applyBindings(new ViewModel());

/** Global methodes
  * to e.g. catch undefined (missing) field values
  */
myUtils = new CommonUtils();

function CommonUtils() {
	this.toFriendlyString = function(str) {
		//this.log("+toFriendlyString()");
		if(str === undefined || str == "undefined" || str === null || str == "null") {
			return "";
		}
		return str;
	};
	/** Handle accented characters in search/filter input
	 */
	this.convert_accented_characters = function(str) {
	    var conversions = new Object();
	    conversions['ae'] = 'ä|æ|ǽ';
	    conversions['oe'] = 'ö|œ';
	    conversions['ue'] = 'ü';
	    conversions['Ae'] = 'Ä';
	    conversions['Ue'] = 'Ü';
	    conversions['Oe'] = 'Ö';
	    conversions['A'] = 'À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ';
	    conversions['a'] = 'à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª';
	    conversions['C'] = 'Ç|Ć|Ĉ|Ċ|Č';
	    conversions['c'] = 'ç|ć|ĉ|ċ|č';
	    conversions['D'] = 'Ð|Ď|Đ';
	    conversions['d'] = 'ð|ď|đ';
	    conversions['E'] = 'È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě';
	    conversions['e'] = 'è|é|ê|ë|ē|ĕ|ė|ę|ě';
	    conversions['G'] = 'Ĝ|Ğ|Ġ|Ģ';
	    conversions['g'] = 'ĝ|ğ|ġ|ģ';
	    conversions['H'] = 'Ĥ|Ħ';
	    conversions['h'] = 'ĥ|ħ';
	    conversions['I'] = 'Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ';
	    conversions['i'] = 'ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı';
	    conversions['J'] = 'Ĵ';
	    conversions['j'] = 'ĵ';
	    conversions['K'] = 'Ķ';
	    conversions['k'] = 'ķ';
	    conversions['L'] = 'Ĺ|Ļ|Ľ|Ŀ|Ł';
	    conversions['l'] = 'ĺ|ļ|ľ|ŀ|ł';
	    conversions['N'] = 'Ñ|Ń|Ņ|Ň';
	    conversions['n'] = 'ñ|ń|ņ|ň|ŉ';
	    conversions['O'] = 'Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ';
	    conversions['o'] = 'ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º';
	    conversions['R'] = 'Ŕ|Ŗ|Ř';
	    conversions['r'] = 'ŕ|ŗ|ř';
	    conversions['S'] = 'Ś|Ŝ|Ş|Š';
	    conversions['s'] = 'ś|ŝ|ş|š|ſ';
	    conversions['T'] = 'Ţ|Ť|Ŧ';
	    conversions['t'] = 'ţ|ť|ŧ';
	    conversions['U'] = 'Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ';
	    conversions['u'] = 'ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ';
	    conversions['Y'] = 'Ý|Ÿ|Ŷ';
	    conversions['y'] = 'ý|ÿ|ŷ';
	    conversions['W'] = 'Ŵ';
	    conversions['w'] = 'ŵ';
	    conversions['Z'] = 'Ź|Ż|Ž';
	    conversions['z'] = 'ź|ż|ž';
	    conversions['AE'] = 'Æ|Ǽ';
	    conversions['ss'] = 'ß';
	    conversions['IJ'] = 'Ĳ';
	    conversions['ij'] = 'ĳ';
	    conversions['OE'] = 'Œ';
	    conversions['f'] = 'ƒ';

	    for(var i in conversions){
	        var re = new RegExp(conversions[i],"g");
	        str = str.replace(re,i);
	    }

	    return str;
	}
}