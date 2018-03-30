var currentConfig = null;

function filesLoaded(files) {
  var container = document.getElementById('container');
  container.innerHTML = ""
  if (files.length == 0) {
      container.innerHTML = 'No files here';
  } else {
    files.sort(fileComparison);
    var hiddenCount = 0;
    files.forEach(function(file) {
      var hidden = currentConfig.lastSeenDate != null && file.modified < currentConfig.lastSeenDate;
      if (hidden) {
        hiddenCount ++;
      }

      var clazz = hidden ? 'seen file' : 'unseen file';
      var id = 'file-' + file.name;
      container.innerHTML += '<p class="' + clazz + '""><a href="#" id="' + id + '" class="link-download" >'
          + file.name + '</a> <span class="modified">' + formatDateTime(file.modified) + "</span></p><br />"

      s3DownloadUrl(file.name, currentConfig.userConfig.bucket, function (err, url) {
        if (err) {
          console.log(err, url);
          return;
        }
        var fileElement = document.getElementById(id);
        fileElement.addEventListener('click', function() {
          chrome.downloads.download({
            url: url
          });
        });
      })
   });
    if (hiddenCount == files.length) {
      container.innerHTML += '<p class="detail-message">No unseen files (' + hiddenCount + ' seen)</p>';
    }
  }

  if (currentConfig.lastSeenDate) {
    var lastSeenLabel = document.getElementById('lbl-last-seen');
    lastSeenLabel.innerHTML = formatDateTime(currentConfig.lastSeenDate);
    var lastSeenLine = document.getElementById('last-seen');
    lastSeenLine.className = lastSeenLine.className.replace('hidden', '');
  }
} 

function s3ListFiles() {
  var bucketName = currentConfig.userConfig.bucket;
  var s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: { Bucket: bucketName }
  });
  
  var container = document.getElementById('status'); 
  container.innerHTML = 'Getting bucket listing...';
  s3.listObjects({}, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      container.innerHTML = 'Error listing files: ' + err.message;
      return;
    }

    container.innerHTML = '';
    var files = data["Contents"];
    filesExcludingFolders = []
    for (var i=0; i<files.length; i++) {
      var file = files[i];
      if (file["Key"].slice(-1) != '/') {
        filesExcludingFolders.push({
          name: file.Key,
          modified: new Date(Date.parse(file.LastModified))
        })
      }
    }

    filesLoaded(filesExcludingFolders);
  });  
}

function s3DownloadUrl(file, bucket, callback) {
  var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: currentConfig.userConfig.bucket }
  });

  s3.getSignedUrl('getObject', {
      Bucket: currentConfig.userConfig.bucket,
      Key: file
  }, callback);
}

function formatDateTime(date) {
  return date.toISOString().slice(0,19).replace('T', " ");
}

function showAllFiles() {
  var button = document.getElementById('btn-view-all');
  var container = document.getElementById('container');
  if (container.className.indexOf('show-all-files') == -1) {
    container.className += "show-all-files"; 
    button.innerHTML = "Hide Seen";
  } else {
    container.className = container.className.replace('show-all-files', "");
    button.innerHTML = "View All";
  }
}

function saveConfig(config) {
  chrome.storage.sync.set({
      userConfig: config.userConfig,
      lastSeenDate: config.lastSeenDate.toISOString()
  });
}

function markAllAsSeen() {
    if (currentConfig) {
        currentConfig.lastSeenDate = new Date();
        saveConfig(currentConfig);
        container.className = container.className.replace('show-all-files', "");
        var button = document.getElementById('btn-view-all');
        button.innerHTML = "View All";
        s3ListFiles();
        chrome.browserAction.setBadgeText({
          text: ""
        });
    }
}

function fileComparison(fileA, fileB) {
  var nameA = fileA.name;
  var sectionsA = nameA.split('/');

  var nameB = fileB.name;
  var sectionsB = nameB.split('/');

  if (sectionsA.length > sectionsB.length) {
    return -1;
  } else if (sectionsB.length > sectionsA.length) {
    return 1;
  }

  for (var i=0; i<sectionsA.length; i++) {
    var comparison = sectionsA[i].localeCompare(sectionsB[i])
    if (comparison != 0) {
      return comparison;
    }
  }
  return 0;
}

function refresh() {
  s3ListFiles();
}

document.getElementById('btn-view-all').addEventListener('click', showAllFiles);
document.getElementById('btn-mark-all').addEventListener('click', markAllAsSeen);
document.getElementById('btn-refresh').addEventListener('click', refresh);

function loadOptions(callback) {
  chrome.storage.sync.get({
    userConfig: null,
    lastSeenDate : null
  }, function(items) {
    if (!items.userConfig) {
      return;
    }
    currentConfig = items;
    currentConfig.lastSeenDate = currentConfig.lastSeenDate == null ? null : new Date(Date.parse(currentConfig.lastSeenDate));
    AWS.config.update({
      region: currentConfig.userConfig.region,
      credentials: new AWS.Credentials(currentConfig.userConfig.accesskey, currentConfig.userConfig.secretkey)
    });
    if (callback) {
      callback();
    }
  });
}

loadOptions(refresh);

