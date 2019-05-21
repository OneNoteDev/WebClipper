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

### 4. Running in edge
[Microsoft instructions](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/adding-and-removing-extensions)
1. In edge, go to about://flags
2. Enable developer mode
3. Restart edge
4. Click on top right "...", then Extensions
5. Click on load extension and select the target\edge\OneNoteWebClipper\edgeextension\manifest\extension

### 5. Looking at console output
Set the "enable_console_logging" local storage entry to true

## Congratulations!
At this point you should see the tests passing, and see the packaged code in the `target` folder


### Other useful commands
#### Clean
```sh
$ npm run clean
```
Removes all of the generated files from `build`
