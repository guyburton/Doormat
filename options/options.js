
var txtConfigFile = document.getElementById('txt-config-file');
var txtJsonConfig = document.getElementById('txt-json-config');

function saveOptions() {
  try {
    var userConfig = JSON.parse(txtJsonConfig.value);
    chrome.storage.sync.get({
      userConfig: null
    }, function(config) {
        config.userConfig = userConfig;
        chrome.storage.sync.set(config,
         function() {
          document.getElementById('status').innerHTML = 'Options saved.';
          setTimeout(function() {
           document.getElementById('status').innerHTML = '';
          },3000);
      });
    });
  } catch (err) {
    document.getElementById('status').innerHTML = 'Error parsing JSON config: ' + err.message;
    return;
  }
}

function restoreOptions() {
  chrome.storage.sync.get({
      userConfig: null
  }, function(items) {
    if (items.userConfig) {
      txtJsonConfig.value = JSON.stringify(items.userConfig, null, 2);
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

