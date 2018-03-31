
version=`cat manifest.json | /usr/local/Cellar/jq/1.5_3/bin/jq -r '.version'`
file=doormat-$version.zip
echo "Building $file"

rm -f $file
zip $file lib popup *.css *.html *.js *.png *.json