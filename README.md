# github-update
Compares package.json version numbers and downloads new release if available.

## Usage
Using the **check** and **update** methods you can quickly create a simple update script.
```js
var updater = require('github-update')({
    repo: "Nioxed/github-update",
    localPath: "./",
});

updater.check( ( error, upToDate ) => {
     if(!upToDate){
        updater.update( (success, error) => {
            StartApp();
        })
    }
})
```

## updater.check
```js    
var updater = require('github-update')(options);

// Check if we're up to date.
updater.check( ( error, upToDate ) => {
    
    //Throw error
    if(error){ throw error; }
    
    if(upToDate){
        // App is up to date.
    }
    
})
```
## updater.update
```js    
var updater = require('github-update')(options);

// Download latest version of the repo and extract it.
updater.update( (success, error) => {
    if(!success){ throw error; };
    StartApp();
})
```

## Options
When requiring the module you need to feed in an options object.

Below is the default config object, The object you supply will override these values. (All values are optional, Their default value will be used if you don't supply it.)
```js
var ExampleOptions = {
    // 'github' or 'gitlab'
    source      : "github", 
    
    // if using gitlab, set to 'gitlab.com'
    rawURL      : "raw.githubusercontent.com",  
    
    // if using gitlab, set to 'gitlab.com'
    baseURL     : "codeload.github.com",  
    
    // The repo we want to check. ( Username/RepoName )
    repo        : "user/repo",
    
    // The branch we want to check. (Only works for github)
    branch      : "master",
    
    // The remote path of the package.json file.
    packageFile : "package.json",
    
    // The local directory we want to download the update to.
    localPath   : "/repo",
    
    // Required for private gitlab repos
    // https://gitlab.com/profile/personal_access_tokens
    privateKey  : "",
    
    // Required for private gitlab repos
    // You can get this from the repos settings page.
    projectID   : "",
    
    // Spams console.log() with whatever we're doing.
    debug       : false
            
}
```

