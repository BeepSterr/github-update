    
    
    var options = {
        rawURL      : "raw.githubusercontent.com",
        baseURL     : "codeload.github.com",
        repo        : "Nioxed/manager-lang",
        branch      : "V3",
        packageFile : "package.json",
        localPath   : "./localRepo",
        debug       : true
        
    }
    
    var updater = require('./')(options);


    updater.check( ( error, upToDate ) => {

        if(error){ throw error; }

        if(upToDate){
			console.log('App is up to date');
            StartApp();
        }else{

            updater.update( (success, error) => {
				if(!success){ throw error; };
				
				console.log('Updated App')
				StartApp();
            })

        }

    })

function StartApp(){
    console.log("App Started");
    process.exit(1);
}

