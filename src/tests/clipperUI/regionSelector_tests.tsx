import {Constants} from "../../scripts/constants";
import {HelperFunctions} from "../helperFunctions";
import {Point, RegionSelector} from "../../scripts/clipperUI/regionSelector";
import {Status} from "../../scripts/clipperUI/status";
import {DomUtils} from "../../scripts/domParsers/domUtils";
import {DataUrls} from "./regionSelector_tests_dataUrls";

let defaultComponent;
QUnit.module("regionSelector", {
	beforeEach: () => {
		let mockClipperState = HelperFunctions.getMockClipperState();
		defaultComponent = <RegionSelector
			clipperState={mockClipperState} />;
	}
});

let assertAreaIsBlack = (pixelValueList: Uint8ClampedArray) => {
	for (let i = 0; i < pixelValueList.length; i++) {
		strictEqual(pixelValueList[i], i % 4 === 3 ? 255 : 0,
			"Every pixel that is not located in the innerFrame's area should be rgba(0, 0, 0, 255)");
	}
};

test("The innerFrame's dimensions should match corners p1 (top left) and p2 (bottom right)", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 50, y: 60 };
	let point2: Point = { x: 75, y: 100 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	let innerFrame = document.getElementById(Constants.Ids.innerFrame);
	ok(innerFrame, "The inner frame should be rendered");
	strictEqual(controllerInstance.refs.innerFrame.style.left, point1.x - 1 + "px",
		"The left style of the inner frame should be the minimum of x1 and x2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.top, point1.y - 1 + "px",
		"The top style of the inner frame should be the minimum of y1 and y2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.width, point2.x - point1.x + "px",
		"The width style of the inner frame should be xMax - xMin");
	strictEqual(controllerInstance.refs.innerFrame.style.height, point2.y - point1.y + "px",
		"The height style of the inner frame should be yMax - yMin");
});

test("The innerFrame's dimensions should match corners p1 (bottom left) and p2 (top right)", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 50, y: 60 };
	let point2: Point = { x: 75, y: 30 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	let innerFrame = document.getElementById(Constants.Ids.innerFrame);
	ok(innerFrame, "The inner frame should be rendered");
	strictEqual(controllerInstance.refs.innerFrame.style.left, point1.x - 1 + "px",
		"The left style of the inner frame should be the minimum of x1 and x2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.top, point2.y - 1 + "px",
		"The top style of the inner frame should be the minimum of y1 and y2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.width, point2.x - point1.x + "px",
		"The width style of the inner frame should be xMax - xMin");
	strictEqual(controllerInstance.refs.innerFrame.style.height, point1.y - point2.y + "px",
		"The height style of the inner frame should be yMax - yMin");
});

test("The innerFrame's dimensions should match corners p1 (top right) and p2 (bottom left)", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 50, y: 60 };
	let point2: Point = { x: 20, y: 100 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	let innerFrame = document.getElementById(Constants.Ids.innerFrame);
	ok(innerFrame, "The inner frame should be rendered");
	strictEqual(controllerInstance.refs.innerFrame.style.left, point2.x - 1 + "px",
		"The left style of the inner frame should be the minimum of x1 and x2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.top, point1.y - 1 + "px",
		"The top style of the inner frame should be the minimum of y1 and y2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.width, point1.x - point2.x + "px",
		"The width style of the inner frame should be xMax - xMin");
	strictEqual(controllerInstance.refs.innerFrame.style.height, point2.y - point1.y + "px",
		"The height style of the inner frame should be yMax - yMin");
});

test("The innerFrame's dimensions should match corners p1 (bottom right) and p2 (top left)", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 50, y: 60 };
	let point2: Point = { x: 10, y: 10 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	let innerFrame = document.getElementById(Constants.Ids.innerFrame);
	ok(innerFrame, "The inner frame should be rendered");
	strictEqual(controllerInstance.refs.innerFrame.style.left, point2.x - 1 + "px",
		"The left style of the inner frame should be the minimum of x1 and x2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.top, point2.y - 1 + "px",
		"The top style of the inner frame should be the minimum of y1 and y2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.width, point1.x - point2.x + "px",
		"The width style of the inner frame should be xMax - xMin");
	strictEqual(controllerInstance.refs.innerFrame.style.height, point1.y - point2.y + "px",
		"The height style of the inner frame should be yMax - yMin");
});

test("The innerFrame's left and top values should be allowed to go negative if xMin and yMin are 0", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 75, y: 100 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	let innerFrame = document.getElementById(Constants.Ids.innerFrame);
	ok(innerFrame, "The inner frame should be rendered");
	strictEqual(controllerInstance.refs.innerFrame.style.left, point1.x - 1 + "px",
		"The left style of the inner frame should be the minimum of x1 and x2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.top, point1.y - 1 + "px",
		"The top style of the inner frame should be the minimum of y1 and y2 minus 1");
	strictEqual(controllerInstance.refs.innerFrame.style.width, point2.x - point1.x + "px",
		"The width style of the inner frame should be xMax - xMin");
	strictEqual(controllerInstance.refs.innerFrame.style.height, point2.y - point1.y + "px",
		"The height style of the inner frame should be yMax - yMin");
});

test("The innerFrame should not exist if no points have been registered, and the outerFrame should", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);
	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");
	ok(!document.getElementById(Constants.Ids.innerFrame),
		"The inner frame should not be rendered");
});

test("The innerFrame should not exist if only the first point has been registered, and the outerFrame should", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = { x: 50, y: 50 };
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");
	ok(!document.getElementById(Constants.Ids.innerFrame),
		"The inner frame should not be rendered");
});

test("The outerFrame should be the size of the window", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	// In the tests, window is set to have non-zero innerWidth and innerHeight by default
	strictEqual(controllerInstance.refs.outerFrame.width, window.innerWidth,
		"The outerFrame's width is the window's innerWidth");
	strictEqual(controllerInstance.refs.outerFrame.height, window.innerHeight,
		"The outerFrame's height is the window's innerHeight");
});

test("The outerFrame should not paint over the space occupied by the innerFrame", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 50, y: 60 };
	let point2: Point = { x: 53, y: 63 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	let context = controllerInstance.refs.outerFrame.getContext("2d");
	let imageDataOfInnerFrame = context.getImageData(point1.x, point1.y, point2.x - point1.x, point2.y - point1.y);

	// Every 4th value in the image data list refers to the pixel's alpha (opacity) value
	for (let i = 3; i < imageDataOfInnerFrame.data.length; i += 4) {
		strictEqual(imageDataOfInnerFrame.data[i], 0,
			"Every pixel that is located in the innerFrame's area should have an alpha of 0");
	}
});

test("The outerFrame should paint over the space not occupied by the innerFrame", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 45, y: 20 };
	let point2: Point = { x: 47, y: 23 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	ok(document.getElementById(Constants.Ids.outerFrame),
		"The outer frame should be rendered");

	// We won't check every pixel in the window (for perf), just a small area outside the innerFrame's area ...
	let context = controllerInstance.refs.outerFrame.getContext("2d");
	let thickness = 3;

	// Top innerFrame edge
	let area = context.getImageData(
		point1.x - thickness, point1.y - thickness,
		point2.x - point1.x + (thickness * 2), thickness);
	assertAreaIsBlack(area.data);

	// Left innerFrame edge
	area = context.getImageData(
		point1.x - thickness, point1.y,
		thickness, point2.y - point1.y);
	assertAreaIsBlack(area.data);

	// Right innerFrame edge
	area = context.getImageData(
		point2.x, point1.y,
		thickness, point2.y - point1.y);
	assertAreaIsBlack(area.data);

	// Bottom innerFrame edge
	area = context.getImageData(
		point1.x - thickness, point2.y,
		point2.x - point1.x + (thickness * 2), thickness);
	assertAreaIsBlack(area.data);

	// ... and the corners of the window

	// Top left window corner
	area = context.getImageData(
		0, 0,
		1, 1);
	assertAreaIsBlack(area.data);

	// Top right window corner
	area = context.getImageData(
		window.innerWidth - 1, 0,
		1, 1);
	assertAreaIsBlack(area.data);

	// Bottom left window corner
	area = context.getImageData(
		0, window.innerHeight - 1,
		1, 1);
	assertAreaIsBlack(area.data);

	// Bottom right window corner
	area = context.getImageData(
		window.innerWidth - 1, window.innerHeight - 1,
		1, 1);
	assertAreaIsBlack(area.data);
});

test("The winWidth and winHeight states should be equal to the window's innerWidth and innerHeight by default", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);
	strictEqual(controllerInstance.state.winWidth, window.innerWidth,
		"The winHeight state should equal window.innerWidth");
	strictEqual(controllerInstance.state.winHeight, window.innerHeight,
		"The winHeight state should equal window.innerHeight");
});

test("The state's firstPoint and secondPoint should update accordingly after a drag event", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let from: Point = { x: 100, y: 100 };
	let to: Point = { x: 200, y: 200 };

	let regionSelectorContainer = $("#" + Constants.Ids.regionSelectorContainer);
	regionSelectorContainer.trigger({ type: "mousedown", pageX: from.x, pageY: from.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mousemove", pageX: to.x, pageY: to.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mouseup", pageX: to.x, pageY: to.y } as JQueryEventObject);

	deepEqual(controllerInstance.state.firstPoint, { x: from.x, y: from.y },
		"The first point should be the same point as the mousedown point");
	deepEqual(controllerInstance.state.secondPoint, { x: to.x, y: to.y },
		"The second point should be the same point as the mouseup point");
});

test("The state's firstPoint and secondPoint should be undefined if the drag distance is zero", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point: Point = { x: 100, y: 100 };

	let regionSelectorContainer = $("#" + Constants.Ids.regionSelectorContainer);
	regionSelectorContainer.trigger({ type: "mousedown", pageX: point.x, pageY: point.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mousemove", pageX: point.x, pageY: point.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mouseup", pageX: point.x, pageY: point.y } as JQueryEventObject);

	ok(!controllerInstance.state.firstPoint, "The first point should be undefined");
	ok(!controllerInstance.state.secondPoint, "The second point should be undefined");
});

test("The state's firstPoint and secondPoint should be undefined if the horizontal drag distance is zero", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let from: Point = { x: 100, y: 100 };
	let to: Point = { x: 100, y: 200 };

	let regionSelectorContainer = $("#" + Constants.Ids.regionSelectorContainer);
	regionSelectorContainer.trigger({ type: "mousedown", pageX: from.x, pageY: from.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mousemove", pageX: to.x, pageY: to.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mouseup", pageX: to.x, pageY: to.y } as JQueryEventObject);

	ok(!controllerInstance.state.firstPoint, "The first point should be undefined");
	ok(!controllerInstance.state.secondPoint, "The second point should be undefined");
});

test("The state's firstPoint and secondPoint should be undefined if the vertical drag distance is zero", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let from: Point = { x: 100, y: 100 };
	let to: Point = { x: 200, y: 100 };

	let regionSelectorContainer = $("#" + Constants.Ids.regionSelectorContainer);
	regionSelectorContainer.trigger({ type: "mousedown", pageX: from.x, pageY: from.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mousemove", pageX: to.x, pageY: to.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mouseup", pageX: to.x, pageY: to.y } as JQueryEventObject);

	ok(!controllerInstance.state.firstPoint, "The first point should be undefined");
	ok(!controllerInstance.state.secondPoint, "The second point should be undefined");
});

test("The state's secondPoint should be updated in the middle of the drag (i.e., before mouseup)", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let from: Point = { x: 100, y: 100 };
	let to: Point = { x: 200, y: 200 };

	let regionSelectorContainer = $("#" + Constants.Ids.regionSelectorContainer);
	regionSelectorContainer.trigger({ type: "mousedown", pageX: from.x, pageY: from.y } as JQueryEventObject);
	regionSelectorContainer.trigger({ type: "mousemove", pageX: to.x, pageY: to.y } as JQueryEventObject);

	deepEqual(controllerInstance.state.firstPoint, { x: from.x, y: from.y },
		"The first point should be the same point as the mousedown point");
	deepEqual(controllerInstance.state.secondPoint, { x: to.x, y: to.y },
		"The second point should be the same point as the mouseup point");
});

test("For a single white pixel as the region selection, its quality should not be downgraded", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let img = new Image();
	let canvas = document.createElement("CANVAS") as HTMLCanvasElement;
	img.onload = () => {
		canvas.getContext("2d").drawImage(img, 0, 0);
		let expectedUrl = canvas.toDataURL("image/png");
		let actualUrl = controllerInstance.getCompressedDataUrl(canvas);
		strictEqual(actualUrl, expectedUrl, "For such a tiny image, the quality should not be downgraded");
		ok(actualUrl.length <= DomUtils.maxBytesForMediaTypes,
			"The resulting image should not exceed maxBytesForMediaTypes");
		done();
	};
	img.src = DataUrls.whitePixelUrl;
});

test("For a large image as the region selection, the resulting image should be downgraded sufficiently to not exceed maxBytesForMediaTypes", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let img = new Image();
	let canvas = document.createElement("CANVAS") as HTMLCanvasElement;
	img.onload = () => {
		canvas.getContext("2d").drawImage(img, 0, 0);
		let actualUrl = controllerInstance.getCompressedDataUrl(canvas);
		ok(actualUrl, "The resulting data url should be non-empty, non-null, and non-undefined");
		ok(actualUrl.length <= DomUtils.maxBytesForMediaTypes,
			"The resulting image should not exceed maxBytesForMediaTypes");
		done();
	};
	img.src = DataUrls.bigImgUrl;
});

test("When the region selection is turned into a canvas, the canvas width and height should be the absolute distance between (x1,x2) and (y1,y2) respectively", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 50, y: 75 };
	let point2: Point = { x: 51, y: 76 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas(DataUrls.tabDataUrl).then((canvas: HTMLCanvasElement) => {
		ok(canvas, "The canvas should be non-undefined");
		strictEqual(canvas.width, Math.abs(point1.x - point2.x), "Width should be the absolute of x1 - x2");
		strictEqual(canvas.height, Math.abs(point1.y - point2.y), "Height should be the absolute of y1 - y2");
		done();
	});
});

test("When the region selection is turned into a canvas, the canvas width and height should be correct when the base image is large", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 50, y: 75 };
	let point2: Point = { x: 200, y: 400 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas(DataUrls.tabDataUrl).then((canvas: HTMLCanvasElement) => {
		ok(canvas, "The canvas should be non-undefined");
		strictEqual(canvas.width, Math.abs(point1.x - point2.x), "Width should be the absolute of x1 - x2");
		strictEqual(canvas.height, Math.abs(point1.y - point2.y), "Height should be the absolute of y1 - y2");
		done();
	});
});

test("When the region selection is turned into a canvas, the canvas width and height should be correct when p1 > p2", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 400, y: 200 };
	let point2: Point = { x: 200, y: 100 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas(DataUrls.tabDataUrl).then((canvas: HTMLCanvasElement) => {
		ok(canvas, "The canvas should be non-undefined");
		strictEqual(canvas.width, Math.abs(point1.x - point2.x), "Width should be the absolute of x1 - x2");
		strictEqual(canvas.height, Math.abs(point1.y - point2.y), "Height should be the absolute of y1 - y2");
		done();
	});
});

test("When the region selection is turned into a canvas, the canvas width and height should be correct when p1 is northeast of p2", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 400, y: 100 };
	let point2: Point = { x: 200, y: 200 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas(DataUrls.tabDataUrl).then((canvas: HTMLCanvasElement) => {
		ok(canvas, "The canvas should be non-undefined");
		strictEqual(canvas.width, Math.abs(point1.x - point2.x), "Width should be the absolute of x1 - x2");
		strictEqual(canvas.height, Math.abs(point1.y - point2.y), "Height should be the absolute of y1 - y2");
		done();
	});
});

test("Given the base image is a white transparent background with 2x2 black on the top left, check that the canvas captures it", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		ok(canvas, "The canvas should be non-undefined");

		let context = canvas.getContext("2d");

		// Top left 2x2 pixels
		let area = context.getImageData(
			0, 0,
			2, 2);
		assertAreaIsBlack(area.data);

		// The 1 pixel border around the black area
		let bottom = context.getImageData(
			0, 2,
			3, 1).data;
		for (let i = 0; i < bottom.length; i++) {
			strictEqual(bottom[i], 255,
				"Every pixel that is not located in the canvas's area should be rgba(255, 255, 255, 255)");
		}
		let right = context.getImageData(
			2, 0,
			1, 2).data;
		for (let i = 0; i < right.length; i++) {
			strictEqual(right[i], 255,
				"Every pixel that is not located in the canvas's area should be rgba(255, 255, 255, 255)");
		}

		done();
	});
});

test("createSelectionAsCanvas should call reject if the base image url is empty", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas("").then((canvas: HTMLCanvasElement) => {
		ok(false, "The promise should not be resolved");
	}, (error: Error) => {
		ok(true, "The promise should be rejected");
	}).then(() => {
		done();
	});
});

test("createSelectionAsCanvas should call reject if the base image url is null", (assert: QUnitAssert) => {
	/* tslint:disable:no-null-keyword */
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas(null).then((canvas: HTMLCanvasElement) => {
		ok(false, "The promise should not be resolved");
	}, (error: Error) => {
		ok(true, "The promise should be rejected");
	}).then(() => {
		done();
	});
	/* tslint:enable:no-null-keyword */
});

test("createSelectionAsCanvas should call reject if the base image url is undefined", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.createSelectionAsCanvas(undefined).then((canvas: HTMLCanvasElement) => {
		ok(false, "The promise should not be resolved");
	}, (error: Error) => {
		ok(true, "The promise should be rejected");
	}).then(() => {
		done();
	});
});

test("createSelectionAsCanvas should call reject if the first point is undefined", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.secondPoint2 = point2;
	});

	controllerInstance.createSelectionAsCanvas(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		ok(false, "The promise should not be resolved");
	}, (error: Error) => {
		ok(true, "The promise should be rejected");
	}).then(() => {
		done();
	});
});

test("createSelectionAsCanvas should call reject if the second point is undefined", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
	});

	controllerInstance.createSelectionAsCanvas(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		ok(false, "The promise should not be resolved");
	}, (error: Error) => {
		ok(true, "The promise should be rejected");
	}).then(() => {
		done();
	});
});

test("createSelectionAsCanvas should call reject if both points are undefined", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	controllerInstance.createSelectionAsCanvas(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		ok(false, "The promise should not be resolved");
	}, (error: Error) => {
		ok(true, "The promise should be rejected");
	}).then(() => {
		done();
	});
});

test("saveCompressedSelectionToState should resolve with the canvas in the general case", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.saveCompressedSelectionToState(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		ok(canvas, "The canvas should be non-undefined");
		strictEqual(canvas.width, Math.abs(point1.x - point2.x), "Width should be the absolute of x1 - x2");
		strictEqual(canvas.height, Math.abs(point1.y - point2.y), "Height should be the absolute of y1 - y2");
		done();
	});
});

test("saveCompressedSelectionToState should set the regionResult state to success in the general case", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.saveCompressedSelectionToState(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		strictEqual(controllerInstance.props.clipperState.regionResult.status, Status.Succeeded, "The regionResult state should indicate it succeeded");
		ok(controllerInstance.props.clipperState.regionResult.data, "The regionResult array should not be undefined");
		strictEqual(controllerInstance.props.clipperState.regionResult.data.length, 1, "The regionResult array should contain one element");
		ok(controllerInstance.props.clipperState.regionResult.data[0], "The regionResult's new element should be a non-empty string");
		done();
	});
});

test("saveCompressedSelectionToState should append the result on subsequent calls", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	controllerInstance.saveCompressedSelectionToState(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		strictEqual(controllerInstance.props.clipperState.regionResult.status, Status.Succeeded, "The regionResult state should indicate it succeeded");
		ok(controllerInstance.props.clipperState.regionResult.data, "The regionResult array should not be undefined");
		strictEqual(controllerInstance.props.clipperState.regionResult.data.length, 1, "The regionResult array should contain one element");
		ok(controllerInstance.props.clipperState.regionResult.data[0], "The regionResult's new element should be a non-empty string");

		let firstData = controllerInstance.props.clipperState.regionResult.data[0];

		point1 = { x: 1, y: 1 };
		point2 = { x: 2, y: 2 };

		HelperFunctions.simulateAction(() => {
			controllerInstance.state.firstPoint = point1;
			controllerInstance.state.secondPoint = point2;
		});

		controllerInstance.saveCompressedSelectionToState(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas2: HTMLCanvasElement) => {
			strictEqual(controllerInstance.props.clipperState.regionResult.status, Status.Succeeded, "The regionResult state should indicate it succeeded");
			ok(controllerInstance.props.clipperState.regionResult.data, "The regionResult array should not be undefined");
			strictEqual(controllerInstance.props.clipperState.regionResult.data.length, 2, "The regionResult array should contain one element");
			ok(controllerInstance.props.clipperState.regionResult.data[1], "The regionResult's new element should be a non-empty string");
			strictEqual(controllerInstance.props.clipperState.regionResult.data[0], firstData, "The first result should not be modified");
			notStrictEqual(controllerInstance.props.clipperState.regionResult.data[1], firstData, "Since new points were selected, the second result should not equal the first");
			done();
		});
	});
});

test("saveCompressedSelectionToState should unset the user's selection in the reject case", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	controllerInstance.saveCompressedSelectionToState(undefined).then((canvas: HTMLCanvasElement) => {
		ok(false, "The promise should not be resolved");
	}, (error: Error) => {
		strictEqual(controllerInstance.state.firstPoint, undefined, "The first point should be undefined");
		strictEqual(controllerInstance.state.secondPoint, undefined, "The first point should be undefined");
		ok(!controllerInstance.state.selectionInProgress, "The selection should not be indicated as in progress");

		strictEqual(controllerInstance.props.clipperState.regionResult.status, Status.NotStarted, "The regionResult state should indicate it has not started");
		ok(!controllerInstance.props.clipperState.regionResult.data, "There shouldn't be any regionResult data");
	}).then(() => {
		done();
	});
});

test("The captured content should display the inner frame", (assert: QUnitAssert) => {
	let done = assert.async();
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let innerFrame = document.getElementById(Constants.Ids.innerFrame) as HTMLDivElement;
	ok(!innerFrame, "The inner frame shouldn't exist when there are no points");

	let point1: Point = { x: 0, y: 0 };
	let point2: Point = { x: 3, y: 3 };

	HelperFunctions.simulateAction(() => {
		controllerInstance.state.firstPoint = point1;
		controllerInstance.state.secondPoint = point2;
	});

	innerFrame = document.getElementById(Constants.Ids.innerFrame) as HTMLDivElement;
	ok(innerFrame, "The inner frame should exist when there are 2 points");

	controllerInstance.saveCompressedSelectionToState(DataUrls.twoByTwoUpperCornerBlackOnTransparentUrl).then((canvas: HTMLCanvasElement) => {
		// Let a redraw occur
		HelperFunctions.simulateAction(() => {});

		innerFrame = document.getElementById(Constants.Ids.innerFrame) as HTMLDivElement;
		ok(innerFrame, "The inner frame should exist when we've taken the screenshot");
		done();
	});
});
