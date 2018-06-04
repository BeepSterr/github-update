    var fs          = require('fs-extra')
    var util        = require('util');
    var path        = require('path');

    var https       = require('https');
    var url         = require('url');

    var unzip       = require('unzip');

    var compareVersions = require('compare-versions')

    module.exports = function( userOptions ) {
        
        this.defaults = {
            rawURL      : "raw.githubusercontent.com",
            baseURL     : "codeload.github.com",
            repo        : "user/repo",
            branch      : "master",
            packageFile : "package.json",
            localPath   : "/repo",
            debug       : false
            
        }

        if(!url.parse(userOptions.rawURL)){ throw "rawURL is not a URL!"; return undefined; }
        if(!url.parse(userOptions.baseURL)){ throw "baseURL is not a URL!"; return undefined; }
        this.options = Object.assign(this.defaults, userOptions);
		
			
		if (!fs.existsSync(options.localPath)){
			fs.mkdirSync(options.localPath);
		}

        try{ 
            
            this.package = JSON.parse( fs.readFileSync(options.localPath + '/' + options.packageFile) ); 
        }catch(ex){ 
            this.package = { version: "0.0.0" }
        }
    
        this.check = function ( callback ){

            if(options.debug){ console.log("Getting: https://" + options.rawURL + "/" + options.repo + "/" + options.branch + "/" + options.packageFile) }
            https.get("https://" + options.rawURL + "/" + options.repo + "/" + options.branch + "/" + options.packageFile, (resp) => {
                
                let data = '';
                if(resp.statusCode != "200"){ return callback(resp.statusCode, null)}
               
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                  data += chunk;
                });
               
                // The whole response has been received. Print out the result.
                resp.on('end', () => {

                    var jsonObj = JSON.parse(data);

                    var currentVersion = this.package.version;
                    var remoteVersion  = jsonObj.version;

                    if(compareVersions(remoteVersion, currentVersion)){
                        return callback(null, false);
                    }else{
                        return callback(null, true);
                    }
    
                });
               
              }).on("error", (err) => {
                    return callback(err. null, null)
              });
    
        }

        this.update = function ( callback ){

            if (!fs.existsSync('./github-updater-temp')){
                fs.mkdirSync('./github-updater-temp');
            }

            if(options.debug){ console.log("Getting: https://" + options.baseURL + "/" + options.repo + "/zip/" + options.branch) }

            var file = fs.createWriteStream("./github-updater-temp/repo.zip");
            https.get("https://" + options.baseURL + "/" + options.repo + "/zip/" + options.branch, function(response) {
               
            response.pipe(file);

                file.on('finish', function() {
                    file.close( ()=> {
                        var file = fs.createReadStream("./github-updater-temp/repo.zip");
                        file.pipe(unzip.Extract({ path: './github-updater-temp/repo' })).on('close', function () {

                                var getFolder = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory()) //thx @pravdomil
                                var Folders = getFolder(__dirname + '/github-updater-temp/repo' );

                                Folders.forEach( fold =>{
														
                                    if(options.debug){ console.log("Moving: [" + __dirname + '/github-updater-temp/repo/' + fold + '] TO: [' + options.localPath + ']') }
                                    fs.copy(__dirname + '/github-updater-temp/repo/' + fold, options.localPath, function (err) {
                                        if (err) return console.error(err)

                                        fs.removeSync('./github-updater-temp');
                                        
                                        callback(true, null);

                                    });

                                });

                        });
                    });
                });
                
            }).on('error', function(err) { // Handle errors
                fs.unlink(file); // Delete the file async. (But we don't check the result)
                if(callback) callback(err.message);
            });

        }

        return this;
    };