/*
	Copyright 2015, Brooks Mershon
*/

window.onload = function() {

	var page = {},
		data = null;

	var title = d3.select("#firstHeading");
	
	page.title = title.text() || page.title;

	var seeAlsoArr = [];

	var seeAlsoChild = d3.select("#See_also").node();

	if(seeAlsoChild) {
		var seeAlsoNode = seeAlsoChild.parentNode; // <h2></h2>
		var seeAlsoList = seeAlsoNode.nextElementSibling; // <ul></ul> or something else

		// iterate through siblings to find next unordered list
		while(seeAlsoList.tagName !== "UL" && d3.select(seeAlsoList).selectAll("ul").empty()) {
			seeAlsoList = seeAlsoList.nextElementSibling;
		}

		if(seeAlsoList) {
			var seeAlsoLinks = d3.select(seeAlsoList).selectAll("a");

			seeAlsoArr = [];
			seeAlsoLinks.each(function(d) {
				seeAlsoArr.push(this.text);
			});

			seeAlsoLinks = d3.select(seeAlsoList).selectAll("a");
		}
	}

	var categoryLinks = d3.select("#mw-normal-catlinks").select("ul").selectAll("a");

	categoriesArr = [];
	categoryLinks.each(function(d) {
		categoriesArr.push(this.text);
	});	

	var aliases = d3.select("p").selectAll("b");

	aliasesArr = [];
	aliases.each(function(d) {
		// innerText because the node is a <b> tag
		aliasesArr.push(this.innerText);
	});	

	if(aliasesArr.length) page.aliases = aliasesArr;
	if(seeAlsoArr.length) page.see_also = seeAlsoArr;
	if(categoriesArr.length) page.categories = categoriesArr;
		
	if(page.title) {
		chrome.runtime.sendMessage({method:"havePage"});
	}

	chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
		if(message.method == 'getPage') {
			sendResponse(page);
		} else if(message.method == 'getResults') {
			if(data) {
				sendResponse(data);
			} else {
				chrome.runtime.sendMessage({method: "performSearch", page: page}, function(results) {
					//data may have an error, which must be evaluated
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