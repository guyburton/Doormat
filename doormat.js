var currentConfig = null;

function filesLoaded(files) {
  var container = document.getElementById('container');
  container.innerHTML = ""
  var lastSeen = currentConfig.lastSeenDate == null ? null : new Date(Date.parse(currentConfig.lastSeenDate));
  if (files.length == 0) {
      container.innerHTML = 'No files here';
  } else {
    files.sort(fileComparison);
    var hiddenCount = 0;
    files.forEach(function(file) {
      var hidden = lastSeen != null && file.modified < lastSeen;
      if (hidden) {
        hiddenCount ++;
      }
      container.innerHTML += formatFileEntry(file.name, file.modified, hidden, file.url);
    });
    if (hiddenCount == files.length) {
      container.innerHTML += '<p class="detail-message">No unseen files (' + hiddenCount + ' seen)</p>';
    }
  }

  if (lastSeen) {
    var lastSeenLabel = document.getElementById('lbl-last-seen');
    lastSeenLabel.innerHTML = formatDateTime(lastSeen);
  } else {
    var lastSeenLine = document.getElementById('last-seen');
    lastSeenLine.className += 'hidden';
  }
} 

function s3ListFiles() {
  var bucketName = currentConfig.userConfig.bucket;
  var s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: { Bucket: bucketName }
  });

  s3.listObjects({}, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      return;
    }

    var files = data["Contents"];
    filesExcludingFolders = []
    for (var i=0; i<files.length; i++) {
      var file = files[i];
      if (file["Key"].slice(-1) != '/') {
        filesExcludingFolders.push({
          name: file.Key,
          modified: new Date(Date.parse(file.LastModified)),
          url: s3DownloadUrl(file.Key, bucketName, currentConfig.userConfig.region)
        })
      }
    }

    filesLoaded(filesExcludingFolders);
 });
}

function s3DownloadUrl(key, bucket, region) {
  return 'https://s3.'+ region + '.amazonaws.com/' + bucket + '/' + key;
}

function formatFileEntry(file, lastModified, hidden, url) {
  var clazz = hidden ? 'seen file' : 'unseen file';
  return '<p class="' + clazz + '""><a href="' + url + '">'
          + file + '</a> <span class="modified">' + formatDateTime(lastModified) + "</span><br /></p>"
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
    if (currentConfig) {
        currentConfig.lastSeenDate = new Date().toISOString();
        chrome.storage.sync.set(currentConfig, function() {
            status.textContent = 'Options saved.';
            setTimeout(function() {
                status.textContent = '';
          }, 3000);
        });
        container.className = container.className.replace('show-all-files', "");
        var button = document.getElementById('btn-view-all');
        button.innerHTML = "View All";
        s3ListFiles();
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

chrome.storage.sync.get({
  userConfig: null,
  lastSeenDate : null
}, function(items) {
  if (!items.userConfig) {
    return;
  }
  currentConfig = items;
  AWS.config.update({
    region: currentConfig.userConfig.region,
    credentials: new AWS.Credentials(currentConfig.userConfig.accesskey, currentConfig.userConfig.secretkey)
  });
  refresh();
});

