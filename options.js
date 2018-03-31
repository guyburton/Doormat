
var defaultUserConfig = {
    "accesskey": "<YOUR IAM ACCESSKEY HERE>",
    "secretkey": "<YOUR IAM SECRETKEY HERE>",
    "bucket": "<YOUR S3 BUCKET NAME HERE>",
    "region": "<YOUR S3 REGION HERE>"
};  

function setStatus(message) {
  var status = document.getElementById('lbl-status');
  if (status) {
    status.innerHTML = message;
    setTimeout(() => status.innerHTML = '', 3000);
  }
}

function saveUserOptions() {
  try {
    setStatus('Saving options...')
    
    if (txtJsonConfig.value.trim().length ==0) {
      saveOptions(defaultUserConfig);
      return;
    }

    var userConfig = JSON.parse(txtJsonConfig.value);
    saveOptions(userConfig);
  } catch (err) {
    setStatus('Error parsing JSON config: ' + err.message);
  }
}

function saveOptions(userConfig) {
  loadOptions(config => 
      chrome.storage.sync.set({
        lastSeenDate: config.lastSeenDate ? config.lastSeenDate.toISOString() : null,
        userConfig: userConfig
      }, () => setStatus('Options saved')));
}

function setLastSeenDate(lastSeenDate, callback) {
  loadOptions(config => 
      chrome.storage.sync.set({
        lastSeenDate: lastSeenDate ? lastSeenDate.toISOString() : null,
        userConfig: config.userConfig
      }, () => {
        setStatus('Options saved')
        callback();
      }));
}

function loadOptions(callback) {
  chrome.storage.sync.get({
    lastSeenDate: null,
    userConfig: defaultUserConfig
  }, loadedConfig => {
    callback({
      lastSeenDate: loadedConfig.lastSeenDate ? new Date(Date.parse(loadedConfig.lastSeenDate)) : null,
      userConfig: loadedConfig.userConfig
    });
  });
}

var txtJsonConfig = document.getElementById('txt-json-config');
if (txtJsonConfig) {
  loadOptions(config => txtJsonConfig.value = JSON.stringify(config.userConfig, null, 2));
}
var saveButton = document.getElementById('save');
if (saveButton) {
  saveButton.addEventListener('click', saveUserOptions);   
}
