/* global chrome */

chrome.runtime.onInstalled.addListener(welcomePage);
chrome.browserAction.onClicked.addListener(toogleExtension);
chrome.webNavigation.onBeforeNavigate.addListener(updateCookies);

function loadData(url, cb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(event) {
		if(xhr.readyState === 4 && xhr.status === 200 && cb) {
			try {
    			cb(JSON.parse(xhr.responseText));
			} catch(e) {
				cb(null, e);
			}
		}
	}
	xhr.open('GET', url, true);
	xhr.send();
}

var cookies = {};

function updateCookiesJson() {
	var url = 'https://raw.githubusercontent.com/kreutix/cookie-notice-accepted/master/cookies.json';
	loadData(url, function(data, err) { 
		if (data) {
			delete data._EOF;
			cookies = data; 
		}
	});
}

// load local cookies.json
loadData(chrome.runtime.getURL('cookies.json'), function(data, err) { 
	if (data) {
		delete data._EOF;
		cookies = data; 
	}
	// load remote cookies.json
	updateCookiesJson();
});

var enabled = false;
chrome.storage.sync.get(null, function(obj) {
	enabled = obj.enabled;
});

function welcomePage(details){
    if (details.reason == 'install'){
		chrome.tabs.create({
			url: 'options.html',
			active: true
		});
	}
}

function toogleExtension(tab){
	if(!enabled){
		enableExtension();
		updateCookies(tab);
		updateCookiesJson();
	} else {
		disableExtension();
		updateCookies(tab);
	}
}

function updateCookies(tab) {
	if (tab.url.indexOf('http') === 0) {
		for (var key in cookies) {
			if (enabled) {
				var expire = new Date/1E3|0;
					expire += 60*60*24*30;
				chrome.cookies.set({
					url: tab.url,
					name: key,
					value: cookies[key],
					expirationDate: expire
				});
			} else {
				chrome.cookies.remove({
					url: tab.url,
					name: key,
				});
			}
		}
	}
}

function enableExtension() {
	enabled = true;
	chrome.browserAction.setIcon({ path: {'19': 'images/icon19.png', '38': 'images/icon38.png'} });
	chrome.browserAction.setTitle({ title: 'Disable Cookie Notice accepted' });
	updateStore();
}

function disableExtension() {
	enabled = false;
	chrome.browserAction.setIcon({ path: {'19': 'images/icon19-gray.png', '38': 'images/icon38-gray.png'} });
	chrome.browserAction.setTitle({ title: 'Enable Cookie Notice accepted' });
	updateStore();
}

function updateStore() {
	chrome.storage.sync.get(null, function(obj) {
		obj.enabled = enabled;
		chrome.storage.sync.set(obj);
	});
}
