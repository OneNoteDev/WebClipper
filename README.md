# WebClipper

## Setup
### 1. Install npm -- https://nodejs.org/en/download/

### 2. Install gulp globally:
```sh
$ npm install --global gulp
```
(Note: on windows, you also need to add "%appdata%\npm" to your PATH)

### 3. Install the WebClipper packages
From the root of this project, run:
```sh
$ npm install
```

### 4. Setup the external d.ts files and link the non-published npm packages
From the root of this project, run:
```sh
$ gulp setup
```

### 5. Build and Test
The default gulp command is to build and test:
```sh
$ gulp
```
 - Compiles LESS and TypeScript into /build
 - Bundles the JavaScript modules together into /bundle
 - Exports all the needed files to /target

## Congratulations!
At this point you should see the tests passing, and see the packaged code in the `target` folder


### Other Gulp shortcuts
#### Gulp clean
```sh
$ gulp clean
```
Removes all of the generated files from `build`

