    
    var exec        = require('child_process').execSync;
    var fs          = require('fs-extra')
    var util        = require('util');
    var path        = require('path');

    var https       = require('https');
    var url         = require('url');

    var unzip       = require('unzip');

    var compareVersions = require('compare-versions')

    module.exports = function( userOptions ) {
        
        this.defaults = {
            source      : "github",
            rawURL      : "raw.githubusercontent.com",
            baseURL     : "codeload.github.com",
            repo        : "user/repo",
            branch      : "master",
            packageFile : "package.json",
            localPath   : "/repo",
            privateKey  : "",
            projectID   : "",
            packages    : "", // one of the following: 'npm', 'yarn' or ''
            runScript   : "", // a npm script to run after updates are complete (& After installPackages)
            debug       : false
            
        }

        this.options = Object.assign(this.defaults, userOptions);
        

        // List of URLS for different services
        this.sources = {
            github: {
                rawfile: "https://" + options.rawURL + "/" + options.repo + "/" + options.branch + "/" + options.packageFile,
                download: "https://" + options.baseURL + "/" + options.repo + "/zip/" + options.branch
            },
            gitlab: {
                rawfile: "https://" + options.rawURL + "/" + options.repo + "/raw/" + options.branch + "/" + options.packageFile,
                download: "https://" + options.rawURL + "/api/v4/projects/" + options.projectID + "/repository/archive.zip"
            }
        }

        //Add private keys to the URL if we need them
        if(options.privateKey != ""){
            sources.gitlab.rawfile += "?private_token=" + options.privateKey
            sources.gitlab.download += "?private_token=" + options.privateKey
            if(this.options.debug){ console.log('SET: GitlLab Private Key') }
        }

        var source = sources[options.source];
		
		if(this.options.debug){ console.log("OPTIONS: " + JSON.stringify(this.options)) };
        if(!url.parse(this.options.rawURL)){ throw "rawURL is not a URL!"; return undefined; }
        if(!url.parse(this.options.baseURL)){ throw "baseURL is not a URL!"; return undefined; }
		
			
		if (!fs.existsSync(options.localPath)){
            if(options.debug){ console.log("Creating " + options.localPath) }
			fs.mkdirSync(options.localPath);
		}
    
        this.check = function ( callback ){


			try{ 
				this.package = JSON.parse( fs.readFileSync(options.localPath + '/' + options.packageFile) ); 
			}catch(ex){ 
				this.package = { version: "0.0.0" }
			}
    
            if(options.debug){ console.log("Starting update check.") }
            if(options.debug){ console.log("GET: " + source.rawfile) }
            https.get( source.rawfile , (resp) => {
                
                let data = '';

                if(resp.statusCode != "200"){ return callback(resp.statusCode, null)}
               
                resp.on('data', (chunk) => {
                  data += chunk;
                });
               
                resp.on('end', () => {

                    var jsonObj = JSON.parse(data);

                    var currentVersion = this.package.version;
                    var remoteVersion  = jsonObj.version;

                    if(compareVersions(remoteVersion, currentVersion)){
                        if(options.debug){ console.log("Update check completed. OUTDATED") }
                        return callback(null, false);
                    }else{
                        if(options.debug){ console.log("Update check completed. UPTODATE") }
                        return callback(null, true);
                    }
    
                });
               
              }).on("error", (err) => {
                    return callback(err. null, null)
              });
    
        }

        this.update = function ( callback ){

            if(options.debug){ console.log("Starting update job.") }

            if (!fs.existsSync('./github-updater-temp')){
                if(options.debug){ console.log("Creating github-updater-temp") }
                fs.mkdirSync('./github-updater-temp');
            }

            if(options.debug){ console.log("GET:" + source.download) }

            var file = fs.createWriteStream("./github-updater-temp/repo.zip");
            https.get( source.download , function(response) {
               
            response.pipe(file);

                file.on('finish', function() {
                    file.close( ()=> {

                        // Unzip the file.
                        if(options.debug){ console.log("Unzipping Files") }
                        var file = fs.createReadStream("./github-updater-temp/repo.zip");
                        file.pipe(unzip.Extract({ path: './github-updater-temp/repo' })).on('close', function () {

                                // Get folders
                                var getFolder = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory()) //thx @pravdomil
                                var Folders = getFolder('./github-updater-temp/repo' );

                                Folders.forEach( fold =>{

                                    // Move from temporary to new location.
                                    if(options.debug){ console.log("Moving: [./github-updater-temp/repo/" + fold + '] TO: [' + options.localPath + ']') }
                                    fs.copy('./github-updater-temp/repo/' + fold, options.localPath, function (err) {
                                        if (err) { return console.error(err) }

                                        // Delete temporary folder
                                        if(options.debug){ console.log("Deleting github-updater-temp") }
                                        fs.removeSync('./github-updater-temp');

                                        //Time to install stuff if needed.
                                        if(String(options.packages).toLowerCase() == 'npm'){

                                            if(options.debug){ console.log("Running 'npm install' in '" + options.localPath + "'") }
                                            
                                            exec('npm install', { cwd: options.localPath + '/' }, function(error, stdout, stderr) {
                                                
                                                if(error){ callback(false, error); return; }
                                                
                                                if(options.debug){ console.log(stdout); }
                                                if(options.debug){ console.log(stderr); }

                                            });

                                        }else if(String(options.packages).toLowerCase() == 'yarn'){

                                            if(options.debug){ console.log("Running 'yarn install' in '" + options.localPath + "'") }

                                            exec('yarn install', { cwd: options.localPath + '/' }, function(error, stdout, stderr) {

                                                if(error){ callback(false, error); return; }
                                                
                                                if(options.debug){ console.log(stdout); }
                                                if(options.debug){ console.log(stderr); }
                                                
                                                
                                            });
                                        }


                                        if(options.runScript != ""){

                                            if(options.debug){ console.log("Running NPM Scripts") }

                                            exec('npm run ' + options.runScript, { cwd: options.localPath + '/' }, function(error, stdout, stderr) {

                                                if(error){ callback(false, error); return; }
                                                
                                                if(options.debug){ console.log(stdout); }
                                                if(options.debug){ console.log(stderr); }
                                                
                                                
                                            });
                                        }

                                        callback(true, null);
                                        
                                        

                                    });

                                });

                        });
                    });
                });
                
            }).on('error', function(err) {
                fs.unlink(file);
                return callback(err.message);
            });

        }

        return this;
    };