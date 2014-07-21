(function() {

var configModel = {
  trailLength: ko.observable(200)
}

console.log(configModel.trailLength());

// Activates knockout.js
ko.applyBindings(configModel);

var width = 970,
    height = 500,
    brushHeight = 60;

var moving,
    minValue,
    maxValue,
    currentValue,
    targetValue,
    alpha = .25;

var formatMinute = d3.format("+.0f");

var x = d3.scale.linear()
    .range([110, width - 40])
    .clamp(true);

var xTicks = {
  "0": "Start",
  "1404": "USA",
  "1448": "NZL"
};

var windFormat = d3.format(".1f");

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(function(t) { console.log(t); return xTicks[t] || formatMinute(t / 60) + " min."; })
    .tickSize(12, 0)
    .tickPadding(5);

var brush = d3.svg.brush()
    .x(x)
    .extent([0, 0])
    .on("brush", brushed);

var projection = d3.geo.mercator()
    .center([-122.429, 37.816])
    .scale(700000)
    .translate([width / 2, height / 2 + 30])
    .clipExtent([[0, 0], [width, height + 1]])
    .precision(0);

var path = d3.geo.path()
    .projection(projection)
    .pointRadius(3.5);

var playButton = d3.select("#g-play-button");

var svg = d3.select(".g-graphic").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "g-background")
    .attr("width", width)
    .attr("height", height + 1);

d3.select("body").append("p").text("nice!");

var slider,
    handle,
    track,
    trail,
    boat,
    wind,
    gate,
    compass;


queue()
    .defer(d3.json, "http://graphics8.nytimes.com/newsgraphics/2013/09/25/americas-cup/cce5c9caaa826312daf3baa050bf80c1a8653d45/topo.json")
    .defer(d3.tsv, "http://graphics8.nytimes.com/newsgraphics/2013/09/25/americas-cup/cce5c9caaa826312daf3baa050bf80c1a8653d45/usa.tsv", type)
    .defer(d3.tsv, "http://graphics8.nytimes.com/newsgraphics/2013/09/25/americas-cup/cce5c9caaa826312daf3baa050bf80c1a8653d45/nzl.tsv", type)
    .await(ready);

function ready(error, topo, usa, nzl) {

  var course = topojson.feature(topo, topo.objects.course);

  indexOffset = -usa[0][2]; // offset from time -> index

  var boats = [
    {type: "LineString", id: "usa", coordinates: usa},
    {type: "LineString", id: "nzl", coordinates: nzl}
  ];

  minValue = -indexOffset + configModel.trailLength();
  maxValue = currentValue = targetValue = usa.length - indexOffset - 1;

  x.domain([minValue, maxValue]);
  xAxis.tickValues(d3.range(0, targetValue, 60 * 5).concat(-180, d3.keys(xTicks)));

  svg.append("path")
      .datum(topojson.mesh(topo, topo.objects.shoreline))
      .attr("class", "g-shoreline")
      .attr("d", path);

  svg.append("path")
      .datum(topojson.feature(topo, topo.objects.shoreline))
      .attr("class", "g-land")
      .attr("d", path);

  gate = svg.append("g")
      .attr("class", "g-course")
    .selectAll("path")
      .data(course.features.filter(function(d) { return d.geometry.type === "LineString"; }))
    .enter().append("path")
      .attr("class", function(d) { return "g-course-" + d.id; })
      .attr("d", path);

  svg.append("path")
      .datum({type: "MultiPoint", coordinates: d3.merge(course.features.map(function(d) { return d.geometry.type === "LineString" ? d.geometry.coordinates : [d.geometry.coordinates]; }))})
      .attr("class", "g-course-points")
      .attr("d", path);

  svg.append("g")
      .attr("class", "g-course-labels")
    .selectAll("text")
      .data(topojson.feature(topo, topo.objects.labels).features)
    .enter().append("text")
      .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
      .attr("dy", ".35em")
      .text(function(d) { return d.id; });

  var gX = svg.append("g")
      .attr("class", "g-x g-axis")
      .attr("transform", "translate(0," + brushHeight / 2 + ")")
      .call(xAxis);

  gX.select(".domain")
    .select(function() { return this.parentNode.insertBefore(this.cloneNode(true), this); })
      .attr("class", "g-halo");

  var tick = gX.selectAll(".tick")
      .each(function() { this.parentNode.appendChild(this); });

  tick.select("line")
      .attr("y1", -8)
      .attr("y2", 8);

  tick.filter(function(d) { return d in xTicks; })
      .attr("class", function(d) { return "tick tick-special tick-" + xTicks[d].toLowerCase(); });

  slider = svg.append("g")
      .attr("class", "g-slider")
      .call(brush);

  slider.selectAll(".extent,.resize")
      .remove();

  slider.select(".background")
      .attr("height", brushHeight);

  handle = slider.append("circle")
      .attr("class", "g-handle")
      .attr("transform", "translate(0," + brushHeight / 2 + ")")
      .attr("r", 8);

  track = svg.selectAll(".g-track")
      .data(boats)
    .enter().append("path")
      .attr("class", function(d) { return "g-track g-track-" + d.id; });

  trail = svg.selectAll(".g-trail")
      .data(boats)
    .enter().append("path")
      .attr("class", function(d) { return "g-trail g-trail-" + d.id; });

  boat = svg.selectAll(".g-boat")
      .data(boats)
    .enter().append("g")
      .attr("class", function(d) { return "g-boat g-boat-" + d.id; })

  boat.append("circle").attr("r", 7);

  boat.append("text")
      .text(function(d) { return d.id.substr(0, 2); })
      .attr("dy", "0.3em")

  d3.select(window)
      .on("keydown", keydowned);

  wind = svg.append("g")
      .datum(usa)
      .attr("class", "g-wind")
      .attr("transform", "translate(900,130)");

  wind.append("text")
      .attr("dy", -18)
      .text("Wind");

  wind.append("text")
      .attr("class", "g-speed")
      .attr("dy", 22)
      .text("");

  compass = wind.append("g")
      .attr("class", "g-compass")

  compass.append("circle")
      .attr("r", 10)

  compass.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 10)
      .attr("y2", -10);

  compass.append("line")
      .attr("x1", 0)
      .attr("x2", -4)
      .attr("y1", -10)
      .attr("y2", -6)

  compass.append("line")
      .attr("x1", 0)
      .attr("x2", 4)
      .attr("y1", -10)
      .attr("y2", -6)

  svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("class", "g-city")
      .text("San Francisco");

  svg.append("text")
      .attr("x", 530)
      .attr("y", 120)
      .attr("class", "g-island")
      .text("Alcatraz Island");

  playButton
      .on("click", paused)
      .each(paused);
}

function paused() {
  if (slider.node().__transition__) {
    slider.interrupt();
    this.textContent = "Play";
  } else {
    if (currentValue === maxValue) slider
        .call(brush.extent([currentValue = minValue, currentValue]))
        .call(brush.event)
        .call(brushBackground);

    targetValue = maxValue;

    slider.transition()
        .duration((targetValue - currentValue) / (targetValue - minValue) * 20000)
        .ease("linear")
        .call(brush.extent([targetValue, targetValue]))
        .call(brush.event)
        .call(brushBackground);

    this.textContent = "Pause";
  }
}

function keydowned() {
  if (d3.event.metaKey || d3.event.altKey) return;
  switch (d3.event.keyCode) {
    case 37: targetValue = Math.max(x.domain()[0], currentValue - configModel.trailLength()); break;
    case 39: targetValue = Math.min(x.domain()[1], currentValue + configModel.trailLength()); break;
    default: return;
  }
  playButton.text("Play");
  slider.interrupt();
  move();
  d3.event.preventDefault();
}

function brushed() {
  if (d3.event.sourceEvent) { // not a programmatic event
    if (d3.event.sourceEvent.target.parentNode === this) { // clicked on the brush
      playButton.text("Play");
      targetValue = x.invert(d3.mouse(this)[0]);
      move();
    }
  } else {
    currentValue = brush.extent()[0];
    handle.attr("cx", x(currentValue));
    var i = Math.round(currentValue) + indexOffset;
    gate.classed("g-course-crossed", function(d) { return currentValue >= d.properties.time; });
    boat.attr("transform", function(d) { return "translate(" + projection(d.coordinates[i]) + ")"; });
    track.attr("d", function(d) { return path({type: "LineString", coordinates: d.coordinates.slice(0, i + 1)}); });
    trail.attr("d", function(d) { return path({type: "LineString", coordinates: d.coordinates.slice(Math.max(0, i - configModel.trailLength()), i + 1)}); });
    wind.select(".g-speed").text(function(d) { return windFormat(d[i][3]) + " knots"; });
    compass.attr("transform", function(d) { return "rotate(" + (180 + d[i][4]) + ")"; });
  }
}

function brushBackground() {
  slider.select(".background")
      .attr("x", -40)
      .attr("width", width + 40);
}

function move() {
  var copyValue = currentValue; // detect interrupt
  if (moving) return false;
  moving = true;

  d3.timer(function() {
    if (copyValue !== currentValue) return !(moving = false);

    copyValue = currentValue = Math.abs(currentValue - targetValue) < 1e-3
        ? targetValue
        : targetValue * alpha + currentValue * (1 - alpha);

    slider
        .call(brush.extent([currentValue, currentValue]))
        .call(brush.event)
        .call(brushBackground);

    return !(moving = currentValue !== targetValue);
  });
}

function type(d) {
  return [+d.x, +d.y, +d.t, +d.ws, +d.wd];
}

})()
