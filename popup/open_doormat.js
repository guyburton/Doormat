function handler() {
	chrome.tabs.query({
		url: "chrome-extension://*/doormat.html"
	}, function(tabs) {
		if (tabs && tabs.length >= 1) {
			chrome.tabs.highlight({
				tabs: [ tabs[0].index ]
			});
		} else {
			chrome.tabs.create({
				url: "doormat.html"
			});
		}
	});
}

document.getElementById('index').addEventListener("click", handler);

document.getElementById('go-to-options').addEventListener("click", function() {
  if (chrome.runtime.openOptionsPage) {
    // New way to open options pages, if supported (Chrome 42+).
    chrome.runtime.openOptionsPage();
  } else {
    // Reasonable fallback.
    window.open(chrome.runtime.getURL('options.html'));
  }
});