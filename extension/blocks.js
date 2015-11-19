/*
	Copyright 2015, Brooks Mershon

	The content script finds information on a bl.ocks.org/<user>/<id> and attempts
	to insert a new gist into the database with the following properties:
	
	{gistid, username, description[, tags][, categories]}

	N.B. [, property] means the property may or may not be present
*/

window.onload = function() {
	var gist = {gistid: null, username: null, description: null};

	gist.description = d3.select('h1').text();
	
	var url = document.location.href.split("/");

	gist.gistid = url[4];
	gist.username = url[3];

	//TODO gather links to wikipedia and record tags

	// color title orange if the gist is "new" or green if this gist has already been recorded
	chrome.runtime.sendMessage({method:"recordGist", gist: gist}, function(result) {
		  d3.select("h1")
		      .style("color", null)
		    .transition()
		      .duration(500)
		      .style("color", (result.success) ? "#E6550D": "#6AA354");
	});
}