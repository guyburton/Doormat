

var alarm = chrome.alarms.create('checkForNewFiles', {
	periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(function() {
	console.log("Checking for modified files")
	chrome.storage.sync.get({
	  userConfig: null,
	  lastSeenDate : null
	}, function(items) {
	  AWS.config.update({
	    region: items.userConfig.region,
	    credentials: new AWS.Credentials(items.userConfig.accesskey, items.userConfig.secretkey)
	  });
	  if (!items.userConfig) {
  		return;
	  }
	  var bucketName = items.userConfig.bucket;
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
	    var modifiedFiles = []
	    var lastSeen = new Date(Date.parse(items.lastSeenDate));
		files.forEach(function(file) {
		    if (file["Key"].slice(-1) != '/') {
		      var modified = new Date(Date.parse(file.LastModified));
		      if (modified > lastSeen) {
		      	modifiedFiles.push(file["Key"]);
		      }
		    }
		});

	    console.log('Found modified: ' + modifiedFiles + '/' + files.length);
		if (modifiedFiles.length > 0) {
			chrome.browserAction.setBadgeText({
				text: "" + modifiedFiles.length
			});
		} else {
			chrome.browserAction.setBadgeText({
				text: ""
			});
		}
	});
	});
});