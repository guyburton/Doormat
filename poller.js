

var alarm = chrome.alarms.create('checkForNewFiles', {
	periodInMinutes: 1
});

alarm.onAlarm.addListener(function() {
	chrome.storage.sync.get({
	  userConfig: {
	      groups : [ 
	        group('Test Group', 'doormat-test')
	      ],
	      region: 'eu-west-2', 
	      accesskey: 'AKIAJEODSG6V45IGL5YQ',
	      secretkey: '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'
	  },
	  lastSeenDate : null
	}, function(items) {
	  AWS.config.update({
	    region: currentConfig.userConfig.region,
	    credentials: new AWS.Credentials(currentConfig.userConfig.accesskey, currentConfig.userConfig.secretkey)
	  });

	  var bucketName = currentConfig.userConfig.groups[0].bucket;
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
		files.forEach(function(file)) {
		    if (file["Key"].slice(-1) != '/') {
		      var modified = new Date(Date.parse(file.LastModified));
		      if (modified > lastSeen) {
		      	modifiedFiles.push(file["Key"]);
		      }
		    }
		}
		if (modifiedFiles.length > 0) {
			chrome.browserAction.setBadgeText({
				text: modifiedFiles.length;
			});
		} else {
			chrome.browserAction.setBadgeText({
				text: ""
			});
		}


	});
});