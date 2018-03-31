
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
      refresh();
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

function refresh() {
  if (txtJsonConfig) {
    loadOptions(config => {
      txtJsonConfig.value = JSON.stringify(config.userConfig, null, 2);
      if (config.userConfig.bucket == defaultUserConfig.bucket ||
          config.userConfig.accesskey == defaultUserConfig.accesskey ||
          config.secretkey == defaultUserConfig.secretkey) {
        document.getElementById('lbl-warning').innerHTML = 
        'This is an <strong>example</strong> configuration- ' +
        'change this to your own AWS S3 bucket and credentials';
      } else {
        document.getElementById('lbl-warning').innerHTML = '';
      }
    });
  }
}

function loadExampleUserConfig() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.extension.getURL('/example_config.json'), true);
  xhr.onreadystatechange = e => {
    if (xhr.readyState == xhr.DONE) {
      if (xhr.status == 200) {
        defaultUserConfig = JSON.parse(xhr.responseText);
      }
      refresh();
    }
  };
  xhr.send();
}

var txtJsonConfig = document.getElementById('txt-json-config');
if (txtJsonConfig) {
  loadExampleUserConfig();
}

var saveButton = document.getElementById('save');
if (saveButton) {
  saveButton.addEventListener('click', saveUserOptions);   
}