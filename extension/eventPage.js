/*
	Copyright 2015, Brooks Mershon
*/

/*
	Listen for messages from content scripts and popup scripts, and route asynchronous requests
	for data from popup to the content script of the activeTab from which the request came.

	Since the Popup may not be open, the eventPage coordinates communication in the event that Popup
	needs information that is cached in the content script's local variables.

	Concent script is able to monitor the state of it's progress in collecting data and caching a
	search result.
 */
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
	if(message.method == 'showPageAction') {
		showPageAction(sender.tab.id, null, sender.tab);
	} else if(message.method == 'ready') {
		updatePageAction(sender.tab.id, null, sender.tab);
		chrome.runtime.sendMessage({method: 'contentReady'});
		return false;
	} else if(message.method == 'queryForPage') {
		queryResults(message.page, sendResponse);
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
		//Popup caches its associated tab; query that tab for page object and call updateGist()
		// chrome.tabs.sendMessage(message.tab.id, {method: 'getPage'}, null, function(page) {
		// 	updateGist(message.gist, page, function(data) {
		// 		console.log(data);
		// 	});
		// });
		//return true;

		return false;
	}

	return false; // no async response fulfillment
});


/*
	Package page as a property on the gist and send to the database.
	Used to learn new information about a result that a user clicked.
	e.g. new categories, new aliases for this particular gist
*/
function updateGist(gist, page, callback) {

	var packagedGist = packageGistPage(gist, page);

	var url = "http://127.0.0.1:3000/gist";

	// cross-origin request
	var request = xhr.json(url)
	    .header("Content-Type", "application/json");

	request.send("POST", JSON.stringify(packagedGist), function(response) {
		callback(JSON.parse(response));
	});
}

/*
	Async call to server endpoint that posts a page object and expects an
	array of gists as a response.
*/
function queryResults(page, callback) {

	// localhost server on port 3000
	var url = "http://127.0.0.1:3000/search";

	// cross-origin request
	var request = xhr.json(url)
	    .header("Content-Type", "application/json");

	request.on("progress", function(t) {
		//TODO
	})
	
	// POST to /wiki with JSON page information and get results in JSON format
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

function errorMessage(code) {
	var m = {
		0: "There was a problem connecting to the server.",
		500: "The server encountered an unexpected error.",
		400: "Something went wrong witht the chrome extension on this article."
	}

	return m[code];
}

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
