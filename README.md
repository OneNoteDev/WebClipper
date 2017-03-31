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
The default comand to build and test:
```sh
$ npm run build
```
 - Compiles LESS and TypeScript into /build
 - Bundles the JavaScript modules together into /build/bundles
 - Exports all the needed files to /target

## Congratulations!
At this point you should see the tests passing, and see the packaged code in the `target` folder


### Other useful commands
#### Clean
```sh
$ npm run clean
```
Removes all of the generated files from `build`

#### Watch
```sh
$ npm run watch
```
Automatically rebuilds the project when files are saved
