
var txtConfigFile = document.getElementById('txt-config-file');
var txtJsonConfig = document.getElementById('txt-json-config');
var status = document.getElementById('status');

// Saves options to chrome.storage
function saveOptions() {
  var config = txtJsonConfig.value;

  try {
    var userConfig = JSON.parse(config);
  } catch (err) {
    status.textContent = 'Error parsing JSON config: ' + err.message;
    return;
  }
  chrome.storage.sync.set({
    userConfig: userConfig
  }, function() {
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    },3000);
  });
}


// Restores form state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  // Use default values
  chrome.storage.sync.get({
      userConfig: null
  }, function(items) {
    if (items.userConfig) {
      txtJsonConfig.value = JSON.stringify(items.userConfig, null, 2);
    }
  });
}

function loadConfigFile(e) {
  e.preventDefault();
  var url = txtConfigFile.value;
  console.log('loading config from ' + url);
  try {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, true);
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
        if (xmlhttp.status == 200) {
          console.log(xmlhttp.responseText);
          txtJsonConfig.value = xmlhttp.responseText;
          saveOptions();
        }
        else {
          console.log(xmlhttp.status + ' ' + xmlhttp.statusText)
          status.textContent = 'Error getting config file: ' + xmlhttp.status + ' ' + xmlhttp.statusText;
        }     
      };
    }
    xmlhttp.send();
  } catch (err) {    
    console.log(err);
    status.textContent = 'Error getting config file: ' + err.message;
  }
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('load-config-file').addEventListener('click', loadConfigFile);

