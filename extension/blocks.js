/**
 *	Copyright 2015, Brooks Mershon
 *
 *	Content script attempts to record information about a block on bl.ocks.org as 
 *  relevant parts of the page are rendered.
 */

var	doc = document.documentElement,
	config = {childList: true, subtree: true},
	origins = {
		"https://en.wikipedia.org/wiki/": "wikipedia",
		"https://en.wikibooks.org/wiki/": "wikibooks",
		"bl.ocks.org": "ocks"
	},
	tagged = {
		"wikipedia": wikipediaTags,
		"wikibooks": wikibooksTags,
		"ocks": ocksTags
	},
	categorized = {
		"wikipedia": wikipediaCategories,
		"wikibooks": wikibooksCategories,
		"ocks": ocksCategories

	};

var originRE = new RegExp(Object.keys(origins).join("|"), 'gi');

var observer = new MutationObserver(function(mutations) {
	var targets = mutations.map(function(d) {return d.target});
	update(targets);
});

observer.observe(doc, config);

var body = d3.select('body');

function update(targets) {
	// empty selection if already recorded
	var description = body.select('h1')
						.filter('h1:not(.recorded)')
						.classed('recorded', true);

	var path = location.pathname.substring(1).split("/")
      	username = path[0],
     	gistid = path[1],
     	sha = path[2]; // TODO
		tags = [],
    	categories = [];

    // find links that have not yet been recorded; extract tags/categories from href
	var links = body.select('.gist-readme').selectAll('a')
					.filter('a:not(.recorded)')
					.each(function(d) {
						var href = d3.select(this).attr('href');
						if(originRE.test(href)) {
							var newTags = extractTags(href);
							var newCategories = extractCategories(href);
							tags = tags.concat(newTags);
							categories = categories.concat(newCategories);
						}
					});

	// classify and mark links so they are not recorded twice
	links.attr("class", function(d) {
		return classifyOrigin(d3.select(this).attr('href'));
	})
	.classed('recorded', true);

	var gist = {gistid: gistid};
	if(description.size()) gist.description = description.text();
	if(description.size()) gist.username = username;
	if(tags.length) gist.tags = tags;
	if(categories.length) gist.categories = categories;

	// record in database if there is ANY new information
	if(Object.keys(gist).length > 1) {
		console.log("recorded data for gist:\n" + JSON.stringify(gist, null, 4));
		// chrome.runtime.sendMessage({method:"foundGist", gist: gist}, function(result) {
		// 	observer.disconnect();
		// 	// TODO indicate successful recording of information from each rendered section
		// 	console.log(result);
		// 	observer.observe(doc, config);
		// });
	}
}

function classifyOrigin(href) {
	for(s in origins) {
		if(origins.hasOwnProperty(s)){
			var siteRE = new RegExp(s);
			if(siteRE.test(href)){
				return origins[s];
			}
		}
	}
}

function extractTags(href) {
	return tagged[classifyOrigin(href)](href);
}

function extractCategories(href) {
	return categorized[classifyOrigin(href)](href);
}

// e.g. https://en.wikipedia.org/wiki/Analemma
function wikipediaTags(href) {
	var components = path(href).split("/");
	var tokens = decodeURIComponent(components[components.length-1]).toLowerCase().split("_");
	return tokens;
}

function wikipediaCategories(href) {
	// no categories in URL
	return [];
}

function wikibooksTags(href) {
	var components = path(href).split("/");
	var tokens = decodeURIComponent(components[components.length-1]).toLowerCase().split("_");
	return tokens;
}

// e.g. https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain
function wikibooksCategories(href) {
	var components = path(href).split("/");
	var strings = decodeURIComponent(components.slice(2, -1));
	return strings;
}

function ocksTags(href) {
	// no categories in URL
	return [];
}

function ocksCategories(href) {
	// no categories in URL
	return [];
}

function path(href) {
	var parser = document.createElement('a');
	parser.href = href;
	return parser.pathname;
}