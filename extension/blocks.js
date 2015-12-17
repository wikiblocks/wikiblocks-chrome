/*
	Copyright 2015, Brooks Mershon

	The content script finds information on a bl.ocks.org/<username>/<gistid> and attempts
	to insert a new gist into the database with the following properties:
	
	{gistid, username, description[, tags][, categories]}

	N.B. [, property] means the property may or may not be present

	This content script is injected into the page after the document has loaded; however, certain
	elements are rendered after the DOM has initially loaded (e.g., .gist-readme). 
*/

var	config = {
		childList: true,
		subtree: true
	};

var observer = new MutationObserver(function(mutations) {
	update();
});

observer.observe(document.documentElement, config);

var body = d3.select('body');

function update() {

	var description = body.select('h1').filter('h1:not(.recorded)').classed('recorded', true);

	var path = location.pathname.substring(1).split("/")
      	username = path[0],
     	gistid = path[1],
     	sha = path[2]; // TODO

    var tags = [],
    	categories = [];

	var links = body.select('.gist-readme').selectAll('a').filter('a:not(.recorded)')
					.each(function(d) {
						var href = d3.select(this).attr('href');
						if(href.indexOf('en.wikipedia.org/wiki/') >= 0) {
							var components = href.split("/");
							var tokens = decodeURIComponent(components[components.length-1]).split("_");
							tokens.forEach(function(t) {tags.push(t.toLowerCase())});
						}
	});

	links.classed('recorded', true).classed('wiki', function(d) {
		return d3.select(this).attr('href').indexOf('en.wikipedia.org/wiki/') >= 0
	});

	var gist = {
		description: (description.size()) ? description.text() : "",
		username: (description.size()) ? username : "",
		gistid: gistid,
		tags: tags,
		categories: categories
	}

	console.log(JSON.stringify(gist, null, 4));

	chrome.runtime.sendMessage({method:"foundGist", gist: gist}, function(result) {
		// must not observe our own mutations
		//indicateSuccess(!result.error && result.success);
	});
}


// green checkmark if gist updated/inserted successfully, or red 'X' if there is a server error
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