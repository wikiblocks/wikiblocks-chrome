/*
	Copyright 2015, Brooks Mershon
*/

!function(){
	var havePage = function(message, sender, sendResponse) {
		showPageAction(sender.tab.id, null, sender.tab);
		return false;
	};

	var ready = function(message, sender, sendResponse) {
		updatePageAction(sender.tab.id, null, sender.tab);
		return false;
	};

	var performSearch = function(message, sender, sendResponse) {
		search(message.page, sendResponse);
		return true;
	}

	var getPage = function(message, sender, sendResponse) {
		//Relay this message to the active tab for fulfillment; active tab caches page object
		chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
			function(tabs){
				var activeTab = tabs[0]; // the active tab when popup requests gists
				chrome.tabs.sendMessage(activeTab.id, {method: 'getPage'}, null, sendResponse);
			}
		);
		return true; // async response fulfillment
	}

	var getResults = function(message, sender, sendResponse) {
		//Relay this message to the active tab for fulfillment; active tab caches search results
		chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
			function(tabs){
				// the active tab when popup sent message
				var activeTab = tabs[0]; 
				// the content script in the activeTab will fulfill
				//the response (asynchronously)	from popup
				chrome.tabs.sendMessage(activeTab.id, {method: 'getResults'}, null, sendResponse);
			}
		);
		return true;
	}

	var foundGist = function(message, sender, sendResponse) {
		discoverGist(message.gist, sendResponse);
		return true;
	}

	var handlers = {
		'havePage': havePage,
		'ready': ready,
		'getPage': getPage,
		'getResults': getResults,
		'performSearch': performSearch,
		'foundGist': foundGist
	}

	/*
		Listen for messages from content scripts and popup scripts. Route asynchronous requests
		for data from popup to the content script which has cached the data (i.e. results, page object).

		The Content script is able to monitor the state of its progress in collecting data and caching a
		search result. The page action icon is used as a visual indicator of the content script's status.
	 */
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
		if(handlers.hasOwnProperty(message.method))
			return handlers[message.method].call(null, message, sender, sendResponse);
		else
			return false;
	});

	/*
		Async call to server endpoint that posts a page object and expects an
		array of gists as a response.
	*/
	function search(page, callback) {

		var url = "http://127.0.0.1:3000/search";

		// cross-origin request
		var request = xhr.json(url)
		    .header("Content-Type", "application/json");
		
		// POST to /search with JSON page object and get results object
		request.send("POST", JSON.stringify(page), function(error, response) {
			if(error) {
				var results = {};
				results.error = {status: error.status, display: errorMessage(error.status)};
				callback(results);
				return;
			}
			callback(JSON.parse(response));
		});
	}

	function discoverGist(gist, callback) {
		var url = "http://127.0.0.1:3000/discover";

		// cross-origin request
		var request = xhr.json(url)
		    .header("Content-Type", "application/json");
		
		// POST to /gist with JSON page object and get results object
		request.send("POST", JSON.stringify(gist), function(error, response) {
			if(error) {
				var results = {};
				results.error = {status: error.status, display: errorMessage(error.status)};
				callback(results);
				return;
			}
			callback(JSON.parse(response));
		});
	}


	// TODO
	function updateGist(result, callback) {
		var url = "http://127.0.0.1:3000/update";

		// cross-origin request
		var request = xhr.json(url)
		    .header("Content-Type", "application/json");
		
		// POST to /gist with JSON page object and get results object
		request.send("POST", JSON.stringify(gist), function(error, response) {
			if(error) {
				callback(error);
			}
			callback(JSON.parse(response));
		});
	}

	function errorMessage(code) {
		var m = {
			0  : "There was a problem connecting to the server.",
			500: "The server encountered an unexpected error.",
			502: "There was a problem connecting to the server.",
			503: "The server is overloaded.",
			400: "Something went wrong with the Chrome extension on this article."
		} 
		return (m[code]) ? m[code] : "Error code with status" + code;
	}

	// used to send an object containing a gist that was clicked and its corresponding page
	function packageGistPage(gist, page) {
		var obj = {};
		obj.gistid = gist.gistid;
		obj.username = gist.username;
		obj.tags = gist.tags;
		obj.page = page;
		return obj;
	}

	function showPageAction(tabId, changeInfo, tab) {
	    chrome.pageAction.show(tabId);
	};

	function updatePageAction(tabId, changeInfo,tab) {
		chrome.pageAction.setIcon({tabId: tabId, path: 'images/icon38_orange.png'});
	}
}();