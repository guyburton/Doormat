var manifestData = chrome.runtime.getManifest();
document.getElementById('lbl-version').innerHTML = manifestData.name +  " version " + manifestData.version;