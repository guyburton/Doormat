# Doormat
Chrome extension for polling/listing s3 buckets with badge notification.

https://chrome.google.com/webstore/detail/gokdbbejdbcampboljgjipjeppjlhkmm

![Alt text](https://github.com/guyburton/Doormat/blob/master/screenshots/doormat_screenshot.png?raw=true "screenshot")


![Alt text](https://github.com/guyburton/Doormat/blob/master/screenshots/options_screenshot.png?raw=true "screenshot")


*Creating an S3 IAM User*

The extension needs an AWS IAM access key/secrect key combination. Keys can be created in the "Security Credentials" tab of the user configuration in the IAM dashboard. You should generally create a new IAM user with limited privileges just for this purpose. See below for an example role limiting access to the s3 bucket 'doormat-test'

<pre>
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:*"
            ],
            "Resource": [
                "arn:aws:s3:::doormat-test/*"
            ]
        }
    ]
}
</pre>