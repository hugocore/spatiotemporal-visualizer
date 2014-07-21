//
// Commons
//

var startDate,
	endDate,
	initialPosition,
	spatialPoints = [],
	activePoints = [],
	entities = [];

function entity() {

	// Setters
	this.id = function(_) {
      if (!arguments.length) return id;
      id = _;
      return this;
    };

    this.points = function(_) {
      if (!arguments.length) return points;
      points = _;
      return this;
    };

}

//
// Helpers
//

function formatDate(date) {
	return d3.time.format("%Y-%m-%d %H:%M:%S").parse(date);
}

function print_filter(filter){
	var f=eval(filter);
	if (typeof(f.length) != "undefined") {}else{}
	if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
	if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
	console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));
}

//
// Setup
//

minDate = formatDate("2008-10-23 02:53:04");
maxDate = formatDate("2008-10-23 11:11:12");
startDate = formatDate("2008-10-23 09:52:00");
endDate = formatDate("2008-10-23 10:07:46");
initialPosition = [39.93403, 116.407526]; // beijing

//
// Slider
//

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

$("#slider").dateRangeSlider({
	bounds: {min: minDate, max: maxDate},
	defaultValues: {min: startDate, max: endDate},
	wheelMode: "scroll",
	wheelSpeed: 1,
	step: {
	    minutes: 1
	},
	formatter:function(val){
		var format = d3.time.format("%Y-%m-%d %H:%M");
		return format(val);
	}
});

/*,
	scales: [{
	  first: function(value){ return value; },
	  end: function(value) {return value; },
	  next: function(value){
	    var next = new Date(value);
	    return new Date(next.setMonth(value.getMonth() + 1));
	  },
	  label: function(value){
	    return months[value.getMonth()];
	  },
	  format: function(tickContainer, tickStart, tickEnd){
	    tickContainer.addClass("myCustomClass");
	  }
	}]*/

d3.json("../json/000-20081023025304.json", function(collection) {

	spatialPoints = [];

	// Add a LatLng object to each item in the dataset
	collection.objects.forEach(function(d) {
		spatialPoints.push({
			coordinates: new L.LatLng(d.point.coordinates[0], d.point.coordinates[1]),
			timestamp: d.point.timestamp,
			date: d3.time.format("%Y-%m-%d %H:%M:%S").parse(d.point.date)
		});
	});

	$("#slider").bind("valuesChanging", function(e, data){
		//console.log("Something moved. min: " + data.values.min + " max: " + data.values.max);
		updatePointsWithRange([data.values.min, data.values.max]);
	});

	//entities.push(entity().id("000").points(spatialPoints));

	//
	// CROSSFILTER
	//

	var spatial = crossfilter(spatialPoints),
		all = spatial.groupAll(),
		date = spatial.dimension(function(d) { return d.date; }),
		dates = date.group(d3.time.minute);

	//console.log(dates.top(Infinity));

	function filterSpatialPointsWithRange(range) {
		activePoints = date.filterRange(range).top(Infinity);
		//console.log("Only " + activePoints.length + " points are active.");
	}

	// How many living things are in my house?
	var n = all.reduceCount().value();
	console.log("There are " + n + " points in total.");

	//console.log(dates.reduceCount().all());
	//var range = [formatDate("2008-10-23 09:52:00"), formatDate("2008-10-23 10:07:46")];

	//
	// MAP
	//

	var map = L.map('map').setView(initialPosition, 11),
		maplink = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
						maxZoom: 18,
					}).addTo(map);

	// Initialize the SVG layer */
	map._initPathRoot();

	// Pick up the SVG from the map object */
	var svg = d3.select("#map").select("svg"),
		mapPoints = svg.append("g"),
		mapTrails = svg.append("g");

	// Use Leaflet to implement a D3 geometric transformation.
	function projectPoint(x, y) {
		var point = map.latLngToLayerPoint(new L.LatLng(y, x));
		this.stream.point(point.x, point.y);
	}

	var transform = d3.geo.transform({point: projectPoint}),
		path = d3.geo.path().projection(transform);

	//
	// Points
	//

	/*d3.selectAll(".testButton")
		.on("click", function() {
			date.filterAll();
			endDate.setTime(endDate.getTime() + 1000 * 60);
			filterSpatialPointsWithRange([startDate, endDate]);
			renderPointers();
		});*/


	filterSpatialPointsWithRange([startDate, endDate]);

	var pointers = mapPoints
		.selectAll("circle")
		.data(date.top(1))
		.enter()
		.append("circle")
		.style("stroke", "black")
		.style("opacity", 0.6)
		.style("fill", "red")
		.attr("r", 5);
		//.style("fill-opacity", 0.6)

	/*var pathLine = d3.svg.line()
		.interpolate("basis-open")
		.x(function(d) { return map.latLngToLayerPoint(d.coordinates).x; })
		.y(function(d) { return map.latLngToLayerPoint(d.coordinates).y; });*/

	var trails = mapTrails
		.selectAll("path")
		.data(date.top(1))
		.enter()
		.append("path")
		.attr("fill", "none")
        .attr("stroke", "#000")

	renderTrails();

	//.attr("class", function(d) { return "g-trail g-trail-" + d.id; });

	function updatePointsWithRange(range) {
		filterSpatialPointsWithRange(range);
		renderPointers();
		renderTrails();
	}

	function renderPointers() {
		if (activePoints.length>0) {
			var newPosition = activePoints[0];
			pointers
				.style("display", "block")
				.attr("transform",
					function(point) {
						return "translate("+
							map.latLngToLayerPoint(newPosition.coordinates).x +","+
							map.latLngToLayerPoint(newPosition.coordinates).y +")";
				});
		} else {
			console.log("HUDE");
			pointers.style("display", "none");
		}
	}

	function renderTrails() {
		if (activePoints.length>0) {
			trails.attr("d", function(d, i) {
				var from = [activePoints[i].coordinates.lng, activePoints[i].coordinates.lat];
				var to = [activePoints[i+1].coordinates.lng, activePoints[i+1].coordinates.lat];
				return path({type: "LineString", coordinates: getActiveCoordinates()});
			});
		}
	}

	function updateOnResize() {
		renderPointers();
		renderTrails();
	}

	function getActiveCoordinates() {
		var coordinates = [];
		activePoints.forEach(function(d) {
			coordinates.push([d.coordinates.lng, d.coordinates.lat]);
		});
		return coordinates;
	}

	//print_filter("myFilter");
	//console.log(myFilter);

	map.on("viewreset", updateOnResize);
	updateOnResize();

});
