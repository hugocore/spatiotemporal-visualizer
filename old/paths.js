d3.select("body").append("p").text("D3.js paths");

var width=600,
	height=400;

var svg = d3.select("body")
			.append("svg")
			.attr("width", width)
			.attr("height", height);

svg.append("rect")
	.attr("width", width)
	.attr("height", height)
	.style("fill", "#e0e9ef");

////////////////////

var points,
	locations,
	coordinates = {};

var projection = d3.geo
                   .mercator()
                   .scale(150)
                   .translate([width / 2, height / 2]);

var path = d3.geo
             .path()
             .pointRadius(2)
             .projection(projection);

queue()
    .defer(d3.json, "airports.json")
    .await(ready);

function ready(error, airports) {

	locations = topojson.feature(airports, airports.objects.airports).features;

	svg.append("g")
		.attr("class", "airports")
		.selectAll("path")
		.data(locations)
		.enter()
		.append("path")
		.attr("d", path);

	for (i in locations) {
		coordinates[locations[i].id] = locations[i].geometry.coordinates;
    }

    console.log(coordinates);

    points = svg.append("g")
    		.attr("class", "points");

    points.selectAll("circle")
    	.data(locations)
    	.enter()
    	.append("circle")
    	.attr("class", "point")
    	.attr("r", 7)
    	.attr("fill", "red")
    	.attr("transform", function(d) {
		    return "translate(" + projection([
		      d.geometry.coordinates[0],
		      d.geometry.coordinates[1]
		    ]) + ")";
		});

	track = svg.selectAll(".g-track")
      	.data(locations)
    	.enter()
    	.append("path")
      	.attr("class", function(d) { return "g-track g-track-" + d.id; });

    track.attr("d", function(d, i) {

		if (i<locations.length-1) {
			return path({type: "LineString", coordinates: [coordinates[locations[i].id], coordinates[locations[i+1].id]]});
		}

	});

}

function move() {

	// RESET
	points.selectAll("circle")
		.attr("transform", function(d) {
		    return "translate(" + projection([
		      d.geometry.coordinates[0],
		      d.geometry.coordinates[1]
		    ]) + ")";
		});

	// RE-PLAY
	points.selectAll("circle")
		.transition()
		.duration(2000)
		.attr("transform", function(d,i) {
			console.log("INDEX:" + i);
			console.log("SIZE:" + locations.length);
			if (i<locations.length-1) {
				return "translate(" + projection(coordinates[locations[i+1].id]) + ")";
			} else {
				return "translate(0,0)";
			}
   		}).ease("quad")
   		.call(move);

}

$("#play-button").on("click", move);
