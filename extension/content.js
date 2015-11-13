/*
	Copyright 2015, Brooks Mershon
*/

window.onload = function() {

	var page = {title: "", aliases: [], see_also: [], categories: []};

	var data = null;

	var title = d3.select("#firstHeading");
	
	page.title = title.text() || page.title;

	var seeAlsoChild= d3.select("#See_also").node();

	if(seeAlsoChild) {
		var seeAlsoNode = seeAlsoChild.parentNode; // <h2></h2>
		var seeAlsoList = seeAlsoNode.nextElementSibling; // <ul></ul> or something else

		// iterate through siblings to find next unordered list
		while(seeAlsoList.tagName !== "UL" && d3.select(seeAlsoList).selectAll("ul").empty()) {
			seeAlsoList = seeAlsoList.nextElementSibling;
		}

		if(seeAlsoList) {
			var seeAlsoLinks = d3.select(seeAlsoList).selectAll("a");

			seeAlsoLinks.each(function(d) {
				page.see_also.push(this.text);
			});

			seeAlsoLinks = d3.select(seeAlsoList).selectAll("a");
		}
	}

	var categoryLinks = d3.select("#mw-normal-catlinks").select("ul").selectAll("a");

	categoryLinks.each(function(d) {
		page.categories.push(this.text);
	});	

	var aliases = d3.select("p").selectAll("b");

	aliases.each(function(d) {
		// innerText because the node is a <b> tag
		page.aliases.push(this.innerText);
	});	

	if(page.title) {
		chrome.runtime.sendMessage({method:"showPageAction"});
	}

	chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
		if(message.method == 'getPage') {
			sendResponse(page);
		} else if(message.method == 'getResults') {
			if(data) {
				sendResponse(data);
			} else {
				chrome.runtime.sendMessage({method: "inProgress"});
				chrome.runtime.sendMessage({method: "queryForPage", page: page}, function(results) {
					data = results;
					sendResponse(results);
					chrome.runtime.sendMessage({method: 'ready'});
				});
				//async fulfillment
				return true;
			}
		};
	});
}