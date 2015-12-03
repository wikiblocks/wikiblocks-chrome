/*
	Copyright 2015, Brooks Mershon

	The content script finds information on a bl.ocks.org/<username>/<gistid> and attempts
	to insert a new gist into the database with the following properties:
	
	{gistid, username, description[, tags][, categories]}

	N.B. [, property] means the property may or may not be present
*/

!function(){

	var gist = buildGist(d3.select('body'));

	chrome.runtime.sendMessage({method:"foundGist", gist: gist}, function(result) {
		indicateSuccess(!result.error && result.success);
		console.log("result:", result);
	});

	function buildGist(g) {

		var gist = {gistid: null, username: null, description: null};

		gist.description = g.select('h1').text();
		
		var url = document.location.href.split("/");

		gist.gistid = url[4];
		gist.username = url[3];

		//TODO gather links to wikipedia and add these tags to description
		var tags = [];

		var links = g.select('.gist-readme').selectAll('a')
						.each(function(d) {
							var href = d3.select(this).attr('href');
							console.log(href);
							if(href.indexOf('en.wikipedia.org/wiki/') >= 0) {
								var components = href.split("/");
								var tokens = decodeURIComponent(components[components.length-1]).split("_");
								tokens.forEach(function(t) {tags.push(t.toLowerCase())});
							}
						});
		gist.tags = tags;

		return gist;
	}

	function indicateSuccess(success) {
		var that = d3.select('h1');
		var desc = that.text();
		that.text(null);
		that.html("<span>" + desc +"</span>");
		that.append('span').html(((success) ? " \u2713" : " \u2717"))
			.style("opacity", 0)
			.style("color", (success) ? "#6AA354" : "#d60000")
			.transition().duration(200)
			.style("opacity", 1);
	}
}();