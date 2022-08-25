<p align="center">
    <img src="./assets/logo.png" alt="RE621">
    <br />
    <span>
        <a href="https://github.com/re621/re621/releases">
            <img src="https://img.shields.io/github/v/release/re621/re621?label=version&style=flat-square" alt="Releases">
        </a>
        <a href="https://github.com/re621/re621/issues">
            <img src="https://img.shields.io/github/issues/re621/re621?&style=flat-square" alt="Issues">
        </a>
        <a href="https://github.com/re621/re621/pulls">
            <img src="https://img.shields.io/github/issues-pr/re621/re621?style=flat-square" alt="Pull Requests">
        </a>
    </span>
</p>


RE621 is a comprehensive project created to improve the basic user experience while browsing e621.net.
It consists of several different modules that enhance the entire site, top to bottom - literally.

For a complete feature overview, visit the [project site](https://re621.bitwolfy.com).

## Installation

The project is delivered via a userscript.
This means that you need a script manager, such as [Tampermonkey](https://www.tampermonkey.net/).  
With a script manager installed, click on this link and follow the instructions on the new page:

> ### IMPORTANT
> This is an ALPHA build of re621 2.0.  
> It is not compatible with the settings format from version 1.5.*, and should only be installed for testing purposes. A tool for converting the settings to a new format is coming later.

Older versions of the script are available on the [Legacy page](https://github.com/re621/re621.Legacy).  
It lacks some features, and will not receive updates besides critical bug fixes.

## Contributing

Contributions are always welcome.  
For bug reports, suggestions, and feature requests, head on over to the [issue tracker](https://github.com/bitWolfy/re621/issues).

## Building the Script

The script is build with webpack.

* Start by cloning the repo as normal 
* Run `npm i` to install dependencies
* Run `npm run build` to start the build process

That will create a production build of the script.  
Artifacts are placed in the `dist` folder, which should now contain `script.user.js` and `script.meta.js`.

In order to build a dev version, set `NODE_ENV` to `development`.  
The easiest way to do so is to create a `.env` file containing `NODE_ENV="development"`.  
In the development mode, only `script.user.js` will be produced, in addition to injector scripts for both Firefox and Chrome.

An injector script loads the main script by referencing a local file.  
This works fine in Chrome; however, in Firefox you will have to run a [TamperDAV server](https://github.com/Tampermonkey/tamperdav).
