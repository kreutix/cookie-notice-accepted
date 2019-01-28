/* global chrome */

chrome.runtime.onInstalled.addListener(welcomePage);
chrome.browserAction.onClicked.addListener(toogleExtension);
chrome.webNavigation.onBeforeNavigate.addListener(updateCookies);

function loadData(url, cb) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = cb;
	xhr.open('GET', url, true);
	xhr.send();
}

var cookies = {};
loadData(chrome.runtime.getURL('cookies.json'), function(data) { 
	cookies = data; 
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
