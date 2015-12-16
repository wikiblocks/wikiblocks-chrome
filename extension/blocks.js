/*
	Copyright 2015, Brooks Mershon

	The content script finds information on a bl.ocks.org/<username>/<gistid> and attempts
	to insert a new gist into the database with the following properties:
	
	{gistid, username, description[, tags][, categories]}

	N.B. [, property] means the property may or may not be present

	This content script is injected into the page after the document has loaded; however, certain
	elements are rendered after the DOM has initially loaded (e.g., .gist-readme). 
*/

var doc = document.documentElement,
	gist = {
		gistid: null,
		username: null,
		description: null
	},
	config = {
		childList: true,
		subtree: true
	};

var observer = new MutationObserver(function(mutations) {
	console.log("****")
	mutations.forEach(function(mutation) {
    	console.log(mutation.target);
  	});
});

observer.observe(doc, config);


// chrome.runtime.sendMessage({method:"foundGist", gist: gist}, function(result) {
// 	indicateSuccess(!result.error && result.success);
// 	console.log("result:", result);
// });

var handlers = {
	'.gist-readme': links
}

function classify(g) {
	return 
}

function description(g) {
	return g.select('h1').text();
}

function links(g) {
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

	return links;
}

function id() {
	return document.location.href.split("/")[4];
}

function username() {
	return document.location.href.split("/")[3];
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