d3.select("body").append("p").text("Experiments");

var radious = [100, 60, 20];
var colors = ["green", "pink", "blue"];

var width=400,
	height=400;

var svg = d3.select("body")
			.append("svg")
			.attr("width", width)
			.attr("height", height);

svg.append("rect")
	.attr("width", width)
	.attr("height", height)
	.style("fill", "#e0e9ef");

svg.selectAll("circle")
	.data(radious)
	.enter()
	.append("circle")
	.attr("cx", 200)
	.attr("cy", 200)
	.attr("r", function (d) {return d;})
	.style("fill", function (d, i) {
		console.log("indice: %s", i);
		return colors[i];
	});

svg.selectAll("text")
	.data(radious)
	.enter()
	.append("text")
	.attr("x", function (d) {
		var t = 10;
		var s = "" + d;
		var l = s.length;
		console.log();
		return 200-((t*l)/2);
	})
	.attr("y", function (d) {return 200-d+20;})
	.text(function (d) {return d;})
	.attr("font-family", "sans-serif")
	.attr("font-size", "20px")
	.attr("fill", "black");
