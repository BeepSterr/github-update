# node-github-updater
Compares package.json version numbers and downloads new release if available.

## Example Usage
```    
var updater = require('node-github-updater')(options);

// Check if we're up to date.
updater.check( ( error, upToDate ) => {
    if(error){ throw error; }

    if(upToDate){
		console.log('App is up to date');
        StartApp();
    }else{
        // We're outdated, Lets update the app!
        updater.update( (success, error) => {
			if(!success){ throw error; };
			
			// WARNING: If the downloaded update includes the current file, You'll need to restart the process.
			console.log('Updated App')
			StartApp();
        })
    }
})

//Example function to start app.
function StartApp(){
    console.log("App Started");
    process.exit(1);
}
```

## Options Object

- `rawURL` The GitHub RAW url **(raw.githubusercontent.com)**
- `baseURL` The GitHub Repo ZIP URL **(codeload.github.com)**
- `repo` Username & Repo Name **(Nioxed/node-github-updater)**
- `branch` Username & Repo Name **(master)**
- `packageFile` Path to the remote package file **(package.json)**
- `localPath` Directory Path to download the repo to **(./)**
- `debug` Enable extra logging. **(false)**

