/*
	Copyright 2015, Brooks Mershon
*/

var data = null,
	currentPage = {},
	loading,
	activeTab;

var results = d3.select("#results");

window.onload = function() {
	chrome.runtime.sendMessage({method:'getPage'}, function(page){
		currentPage = page;
		updateHeader();

		chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, function(tabs){
			activeTab = tabs[0]; // cache active tab
			updateLoading();
			// must check for results.error
			chrome.runtime.sendMessage({method:'getResults'}, function(results){
				clearInterval(loading);
				data = results;
				updateResults();
			});
		});
	});
}

function updateHeader() {
	d3.select("#wb-pageTitle").html(currentPage.title);
}

function updateLoading() {
	d3.select("#wb-intro").html("Searching for blocks...");

	// Adapted from http://bl.ocks.org/mbostock/3f987887d5c2148661ae
	loading = setInterval(function() {
		console.log("running");
		d3.select("#wb-pageTitle")
			.style("color", d3.hcl(Math.random() * 360, 100, 50))
		  .transition()
			.duration(500)
			.style("color", function() {
				var that = d3.select(this),
				fill0 = that.style("color"),
				fill1 = that.style("color", null).style("color");
				that.style("color", fill0);
				return fill1;
			});
	}, 500);
}

function updateResults(){

	if(data.error) {
		d3.select("#wb-intro").html(data.error.display);
		return;
	}

	if(data.gists.length == 0) {
		d3.select("#wb-intro").html("Could not find any <b>bl.ocks</b>. " + 
					"Woud you <a href=\"http://bost.ocks.org/mike/block/\" target=\"_blank\">like to make one</a>?");
	} else {
		var plural = (data.gists.length > 1) ? "s" : "";
		var duration = data.end - data.start;
		d3.select("#wb-intro").html("Found " + data.gists.length + " block" + plural + " (" + duration/1000 + " seconds)");
	}

	function elapsed(t) {
		var t0 = data.start;
		return t - t0;
	}

	// update results list
	results.selectAll("div")
	    .data(data.gists)
	  .enter().append("div").attr("class", "result")
	    .attr("gistid", function(d) { return d.gistid; })
	  .call(function(parent){
	    parent.append('span').append('a')
			.attr("href", function(d) {return "http://bl.ocks.org/" + d.username + "/" + d.gistid})
			.attr("class", "gist")
			.classed("mdl-shadow--2dp", true)
			.attr("target", "_blank")
			.style("background-image", function(d) {return "url(http://bl.ocks.org/" + d.username + "/raw/" + d.gistid + "/thumbnail.png)"})
			.html(function(d) {return "<span class=description>" + d.description + "</span>"})
			.on("mouseenter", function(d, i) {
				d3.select(this).classed("mdl-shadow--6dp", true);
				var result = d3.select(this).node().parentNode.parentNode;
				d3.select(result).selectAll("li").classed("highlight", true);
			})
			.on("mouseout", function(d, i) {
				d3.select(this).classed('mdl-shadow--6dp', false)
							   .classed('mdl-shadow--2dp', true);
				var result = d3.select(this).node().parentNode.parentNode;
				d3.select(result).selectAll("li").classed("highlight", false);
			})
			.on("click", clickResult);

		var info = parent.append('span').append('ul');

		//summary information for a result
		info.attr("class", "info-list");
	   	info.append('li').text(function(d) { return d.username }).attr("class", "username");
	    info.append('li').text(function(d) { return d.tags.join(", ")}).attr("class", "tag");
	  });
}

// makes use of cached tab in order to associate a gist with the page it came from
function clickResult(d, i) {
	chrome.runtime.sendMessage({method:'clickedGist', tab: activeTab, gist: d});
}