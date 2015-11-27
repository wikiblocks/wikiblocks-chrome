/*
	Copyright 2015, Brooks Mershon
*/

!function(){
	var data = null,
	currentPage = {},
	activeTab;

	var countFormat = d3.format(",");

	var idfSizeScale = d3.scale.linear()
					.range([.8, 1.8]);

	var opacityScale = d3.scale.linear()
					.range([0.3, 1]);

	var results = d3.select("#results");

	window.onload = function() {
		chrome.runtime.sendMessage({method:'getPage'}, function(page){
			currentPage = page;
			updateHeader();

			chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, function(tabs){
				activeTab = tabs[0]; // cache active tab
				loading(true);
				// must check for results.error
				chrome.runtime.sendMessage({method:'getResults'}, function(results){
					loading(false);
					data = results;
					updateResults();
				});
			});
		});
	}

	function updateHeader() {
		d3.select("#wb-pageTitle").html(currentPage.title);
	}

	function on() {
		d3.select(this)
		  .transition()
			.ease("linear")
			.duration(500)
			.style("color", d3.hcl(Math.random() * 360, 100, 50))
			.each("end", off);
	}

	function off() {
		d3.select(this)
		  .transition()
			.duration(500)
			.style("color", function() {
				var that = d3.select(this),
				fill0 = that.style("color"),
				fill1 = that.style("color", null).style("color");
				that.style("color", fill0);
				return fill1;
			})
			.each("end", on);
	}

	function stop() {
		d3.select(this)
		  .transition()
			.duration(200)
			.style("color", function() {
				var that = d3.select(this),
				fill0 = that.style("color"),
				fill1 = that.style("color", null).style("color");
				that.style("color", fill0);
				return fill1;
			});
	}

	function loading(show) {
		d3.select("#wb-intro").html((show) ? "Searching for blocks..." : "");

		if(show)
			d3.select("#wb-pageTitle").each(on);
		else
			d3.select("#wb-pageTitle").each(stop);
	}

	function updateResults(){

		var total,
			maxScore;

		if(data.error) {
			d3.select("#wb-intro").html(data.error.display);
			return;
		}

		if(data.gists.length == 0) {
			d3.select("#wb-intro").html("Could not find any related <b>bl.ocks</b>. " + 
						"Woud you <a href=\"http://bost.ocks.org/mike/block/\" target=\"_blank\">like to make one</a>?");
		} else {
			var plural = (data.gists.length > 1) ? "s" : "";
			var duration = data.end - data.start;
			total = data.gists[0].count;
			maxScore = d3.max(data.gists, function(d) {return d.score});
			console.log(maxScore)
			opacityScale.domain([0, maxScore]);
			idfSizeScale.domain([0, Math.log(total)]);
			d3.select("#wb-intro").html("Found " + countFormat(data.gists.length) + " block" + plural + " (" + duration/1000 + " seconds)");
			if(data.gists.length >= 10)
				d3.select(".next").style("visibility", "visible");

		}

		function elapsed(t) {
			var t0 = data.start;
			return t - t0;
		}

		// update results list
		results.selectAll("div")
		    .data(data.gists)
		  .enter().append("div")
		  	.attr("class", "result")
		    .attr("id", function(d, i) { return d.gistid; })
			.call(function(parent){

				var rank = parent.append('span')
								   .attr("class", "rank");

				rank.html(function(d, i) {return (i + 1)});

				var result = parent.append('span');
				result.append('a')
					.attr("href", function(d) { return "http://bl.ocks.org/" + d.username + "/" + d.gistid})
					.attr("class", "gist")
					.classed("mdl-shadow--2dp", true)
					.attr("target", "_blank")
					.style("background-image", function(d) { return "url(http://bl.ocks.org/" + d.username + "/raw/" + d.gistid + "/thumbnail.png)"})
					.html(function(d) {
						return "<span class=description>" + d.description + "</span>" +
								"<span class=username>" + d.username + "</span>" +
								"<span class=score>" + d.score.toFixed(3) + "</span>"
					})
					.on("mouseenter", function(d, i) {
						d3.select(this).classed("mdl-shadow--6dp", true);
					})
					.on("mouseout", function(d, i) {
						d3.select(this).classed('mdl-shadow--6dp', false)
						.classed('mdl-shadow--2dp', true);
					})
					.on("click", clickResult);

				var info = parent.append('span');

				var tagList = info.append('ul').attr("class", "tag-list")
								  
				tagList.selectAll('li').data(function(d) { return d.tags})
					.enter()
						.append('li')
						.html(function(d, i) { return ((i == 0) ? "" : "&nbsp;") + d.tag})
						.style("font-size", function(d) { return idfSizeScale(d.idf) + "em"})
						.style("opacity", function(d) { return opacityScale(d.score)});
			});
	}

	// makes use of cached tab in order to associate a gist with the page it came from
	function clickResult(d, i) {
		chrome.runtime.sendMessage({method:'clickedGist', tab: activeTab, gist: d});
	}
}();
