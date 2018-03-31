
function filesLoaded(files, config) {
  var container = document.getElementById('container');
  container.innerHTML = ""
  if (files.length == 0) {
      container.innerHTML = 'No files here';
  } else {
    files.sort(fileComparison);
    var hiddenCount = 0;
    files.forEach(function(file) {
      var hidden = config.lastSeenDate != null && file.modified < config.lastSeenDate;
      if (hidden) {
        hiddenCount ++;
      }

      var clazz = hidden ? 'seen file' : 'unseen file';
      var id = 'file-' + file.name;
      container.innerHTML += '<p class="' + clazz + '""><a href="#" id="' + id + '" class="link-download" >'
          + file.name + '</a> <span class="modified">' + formatDateTime(file.modified) + "</span><br /></p>"

      s3DownloadUrl(file.name, config.userConfig.bucket, function (err, url) {
        if (err) {
          console.log(err, url);
          return;
        }
        var fileElement = document.getElementById(id);
        fileElement.setAttribute('href', url);
        fileElement.addEventListener('click', function(e) {
          e.preventDefault();
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

  if (config.lastSeenDate) {
    var lastSeenLabel = document.getElementById('lbl-last-seen');
    lastSeenLabel.innerHTML = formatDateTime(config.lastSeenDate);
    var lastSeenLine = document.getElementById('last-seen');
    lastSeenLine.className = lastSeenLine.className.replace('hidden', '');
    var lastSeenLine = document.getElementById('btn-view-all');
    lastSeenLine.className = lastSeenLine.className.replace('hidden', '');
  }
} 

function setStatus(message) {
  var container = document.getElementById('status'); 
  container.innerHTML = message;
}

function s3ListFiles(config) {
  var bucketName = config.userConfig.bucket;
  var s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: { Bucket: bucketName }
  });
  
  setStatus('Getting bucket listing...');
  s3.listObjects({}, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      setStatus('Error listing files: ' + err.message);
      return;
    }

    setStatus('');
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

    filesLoaded(filesExcludingFolders, config);
  });  
}

function s3DownloadUrl(file, bucket, callback) {
  var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: bucket }
  });

  s3.getSignedUrl('getObject', {
      Bucket: bucket,
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

function markAllAsSeen() {
  container.className = container.className.replace('show-all-files', "");
  var button = document.getElementById('btn-view-all');
  button.innerHTML = "View All";
  chrome.browserAction.setBadgeText({
    text: ""
  });

  setLastSeenDate(new Date(), refresh);
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
  loadOptions(config => {
    if (config.userConfig.accesskey == defaultUserConfig.accesskey || config.userConfig.secretkey == defaultUserConfig.secretkey) {
      setStatus('You need to set your AWS IAM credentials in the options page');
      return;
    }
    if (config.userConfig.region == defaultUserConfig.region) {
      setStatus('You need to set your AWS region in the options page');
    }
    if (config.userConfig.bucket == defaultUserConfig.bucket) {
      setStatus('You need to set your AWS bucket name in the options page');
    }
    AWS.config.update({
      region: config.userConfig.region,
      credentials: new AWS.Credentials(config.userConfig.accesskey, config.userConfig.secretkey)
    });

    s3ListFiles(config);
  });
}

document.getElementById('btn-view-all').addEventListener('click', showAllFiles);
document.getElementById('btn-mark-all').addEventListener('click', markAllAsSeen);
document.getElementById('btn-refresh').addEventListener('click', refresh);

refresh();

