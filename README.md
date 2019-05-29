# WebClipper

## Setup
### 1. Install npm -- https://nodejs.org/en/download/

(Note: on windows, you also need to add "%appdata%\npm" to your PATH)

### 2. Install the WebClipper packages
From the root of this project, run:
```sh
$ npm install
```

### 3. Build and Test
The default command to build and test:
```sh
$ npm run build
or
$ npm run build -- --<arg>
```
 - Compiles LESS and TypeScript into /build
 - Bundles the JavaScript modules together into /build/bundles
 - Exports all the needed files to /target

### 4. Running in chrome
[Google instructions](https://support.google.com/chrome/a/answer/2714278?hl=en)
1. In chrome, open chrome://extensions/
2. Enable developer mode (upper right toggle)
3. Click on "load unpacked" and select the target/chrome folder
4. On subsequent builds, you don't have to go through this flow again. Simply refreshing the page should update the add-in

### 4. Running in edge
[Microsoft instructions](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/adding-and-removing-extensions)
1. In edge, go to about://flags
2. Enable developer mode
3. Restart edge
4. Click on top right "...", then Extensions
5. Click on load extension and select the target\edge\OneNoteWebClipper\edgeextension\manifest\extension
6. On subsequent builds, you need to go through steps (4) and (5) again

### 5. Looking at console output
Set the "enable_console_logging" local storage entry to true

### 6. Shipping an update to the store
Every store is different and you'll have to look at our internal guide to understand how to ship an update. In general, shipping in chrome/edge is easy and shipping in FF/Safari is hard. We don't ship any updates to IE anymore. [Guide is here](https://microsoft.sharepoint-df.com/teams/remember/_layouts/OneNote.aspx?id=%2Fteams%2Fremember%2FShared%20Documents%2FAll%20Microsoft%2FNotes%20Services%2FNotebooks%2FOneNote%20Services%20Team%20%28Moved%29&wd=target%28Content%20Capture%2FWeb%20Clipper.one%7CFC39B47B-3332-4BAA-B0BB-A8AF57D0BEAC%2FShip%20Checklist%7CFD94AA9C-2CD7-A142-AADF-B99949DF14B0%2F%29)

#### Edge
[Instructions here](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/packaging/using-manifoldjs-to-package-extensions)
1. Build locally `npm run build`
2. Run `npm run pack-edge`. The results will be in /OneNoteWebClipper/EdgeExtension
3. Now log into the [developer site](https://developer.microsoft.com/en-us/dashboard/apps/9NBLGGH4R01N) and update the package

## Congratulations!
At this point you should see the tests passing, and see the packaged code in the `target` folder


### Other useful commands
#### Clean
```sh
$ npm run clean
```
Removes all of the generated files from `build`
