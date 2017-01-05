declare var require;

let promise = require("es6-promise");

export class Polyfills {
	public static init() {
		this.endsWithPoly();
		this.objectAssignPoly();
		this.promisePoly();
		this.requestAnimationFramePoly();
	}

	// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
	private static endsWithPoly() {
		if (!(String.prototype as any).endsWith) {
			(String.prototype as any).endsWith = function(searchString, position) {
				let subjectString = this.toString();
				if (typeof position !== "number" || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
					position = subjectString.length;
				}
				position -= searchString.length;
				let lastIndex = subjectString.lastIndexOf(searchString, position);
				return lastIndex !== -1 && lastIndex === position;
			};
		}
	}

	// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	private static objectAssignPoly() {
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

	private static promisePoly() {
		if (typeof Promise === "undefined") {
			promise.polyfill();
		}
	}

	private static requestAnimationFramePoly() {
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
