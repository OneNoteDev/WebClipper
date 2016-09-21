declare var require;

let promise = require("es6-promise");

export module Polyfills {
	export function init() {
		objectAssignPoly();
		promisePoly();
		requestAnimationFramePoly();
	}

	// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	function objectAssignPoly() {
		if (typeof (<any>Object).assign !== "function") {
			(<any>Object).assign = function(target: Object) {
				if (!target) {
					throw new TypeError("Cannot convert undefined to object");
				}

				let output = Object(target);
				for (let index = 1; index < arguments.length; index++) {
					let source = arguments[index];
					if (source) {
						for (let nextKey in source) {
							if (source.hasOwnProperty(nextKey)) {
								output[nextKey] = source[nextKey];
							}
						}
					}
				}
				return output;
			};
		}
	}

	function promisePoly() {
		if (typeof Promise === "undefined") {
			promise.polyfill();
		}
	}

	function requestAnimationFramePoly() {
		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = (<any>window).msRequestAnimationFrame || (<any>window).mozRequestAnimationFrame
				|| (<any>window).webkitRequestAnimationFrame || (<any>window).oRequestAnimationFrame || ((callback: FrameRequestCallback) => {
					setTimeout(() => {
						callback(Date.now());
					}, 16);
				});
		}
	}
}
