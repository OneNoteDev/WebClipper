# WebClipper

## Setup
### 1. Install npm -- https://nodejs.org/en/download/

### 2. Install gulp globally:
```sh
$ npm install --global gulp
```
(Note: on windows, you also need to add "%appdata%\npm" to your PATH)

### 3. Setup dependency repos
Locally clone the [`OneNoteDev/OneNoteApi`](https://github.com/onenotedev/onenoteapi) and [`OneNoteDev/OneNotePicker-JS`](https://github.com/onenotedev/onenotepicker-js) repos as siblings of `WebClipper`.

Follow the README instructions provided for each (basically, you'll need to separately run `npm install`, `gulp setup`, and `gulp` from these repos as well).

### 4. Install the WebClipper packages
From the root of this project, run:
```sh
$ npm install
```

### 5. Setup the external d.ts files and link the non-published npm packages
From the root of this project, run:
```sh
$ gulp setup
```

### 6. Build and Test
The default gulp command is to build and test:
```sh
$ gulp
```
 - Compiles LESS and TypeScript into /build
 - Bundles the JavaScript modules together into /bundle
 - Exports all the needed files to /target and /serverRoot/root

## Congratulations!
At this point you should see the tests passing, and see the packaged code in the `target` folder


### Other Gulp shortcuts
#### Gulp clean
```sh
$ gulp clean
```
Removes all of the generated files from `build`

#### Gulp start
```sh
$ gulp start
```
Starts a node server in the background

#### Gulp stop
```sh
$ gulp stop
```
Stops the background node server
