/*
	Copyright 2015, Brooks Mershon
*/

/*
	Listen for messages from content scripts and popup scripts. Route asynchronous requests
	for data from popup to the content script which has cached the data (i.e. results, page object).

	The Content script is able to monitor the state of its progress in collecting data and caching a
	search result. The page action icon is used as a visual indicator of the content script's status.
 */
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
	if(message.method == 'showPageAction') {
		showPageAction(sender.tab.id, null, sender.tab);
	} else if(message.method == 'ready') {
		updatePageAction(sender.tab.id, null, sender.tab);
		chrome.runtime.sendMessage({method: 'contentReady'});
		return false;
	} else if(message.method == 'queryForPage') {
		query(message.page, sendResponse);
		return true;
	} else if(message.method == 'getPage') {
		//Relay this message to the active tab for fulfillment; active tab caches page object
		chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
			function(tabs){
				var activeTab = tabs[0]; // the active tab when popup requests gists
				chrome.tabs.sendMessage(activeTab.id, {method: 'getPage'}, null, sendResponse);
			}
		);
		return true; // async response fulfillment
	} else if(message.method == 'onBlocks') {
		//Relay this message to the active tab for fulfillment; active tab caches page object
		chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
			function(tabs){
				var activeTab = tabs[0]; // the active tab when popup requests gists
				chrome.browserAction.setPopup({"tabId":activeTab.id,"popup":"blocks_popup.html"});
			}
		);
		return false; // async response fulfillment
	} else if(message.method == 'getResults') { //from popup
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
	} else if (message.method == 'clickedGist') {
		// TODO
		return false;
	} else if (message.method == 'recordGist') {
		recordGist(message.gist, sendResponse);
		return true;
	}

	return false; // no async response fulfillment
});

/*
	Async call to server endpoint that posts a page object and expects an
	array of gists as a response.
*/
function query(page, callback) {

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

function recordGist(gist, callback) {
	var url = "http://127.0.0.1:3000/gist";

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
		0: "There was a problem connecting to the server.",
		500: "The server encountered an unexpected error while performing a search.",
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

function showPageAction(tabId, changeInfo,tab) {
    chrome.pageAction.show(tabId);
};

function updatePageAction(tabId, changeInfo,tab) {
	chrome.pageAction.setIcon({tabId: tabId, path: 'images/icon38_orange.png'});
}
