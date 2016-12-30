import {SelectionHelper, SelectionMode} from "../contentCapture/selectionHelper";

import {DomUtils} from "../domParsers/domUtils";

import * as Log from "../logging/log";

import {Constants} from "../constants";
import {Status} from "./status";

import {ClipperStateProp} from "./clipperState";
import {ComponentBase} from "./componentBase";
import {Clipper} from "./frontEndGlobals";

export interface Point {
	x: number;
	y: number;
};

interface RegionSelectorState {
	firstPoint?: Point;
	secondPoint?: Point;
	selectionInProgress?: boolean;
	winWidth?: number;
	winHeight?: number;
}

class RegionSelectorClass extends ComponentBase<RegionSelectorState, ClipperStateProp> {
	private devicePixelRatio: number = 1;

	private resizeHandler = this.handleResize.bind(this);

	getInitialState(): RegionSelectorState {
		return {
			selectionInProgress: false,
			winHeight: window.innerHeight,
			winWidth: window.innerWidth
		};
	}

	constructor(props: ClipperStateProp) {
		super(props);
		this.resetState();

		window.addEventListener("resize", this.resizeHandler);
	}

	private onunload() {
		window.removeEventListener("resize", this.resizeHandler);
	}

	/**
	 * Start the selection process over
	 */
	private resetState() {
		this.setState({ firstPoint: undefined, secondPoint: undefined, selectionInProgress: false });
		// TODO use lodash
		this.props.clipperState.setState({
			selectionResult: {
				status: Status.NotStarted,
				data: {
					mode: SelectionMode.Region,
					htmlSelections: this.props.clipperState.selectionResult.data.htmlSelections
				}
			}
		});
	}

	/**
	 * Define the starting point for the selection
	 */
	private startSelection(point: Point) {
		if (this.props.clipperState.selectionResult.status !== Status.InProgress) {
			this.setState({ firstPoint: point, secondPoint: undefined, selectionInProgress: true });
			// TODO use lodash
			this.props.clipperState.setState({
				selectionResult: {
					status: Status.InProgress,
					data: this.props.clipperState.selectionResult.data
				}
			});
		}
	}

	/**
	 * The selection is complete
	 */
	private completeSelection(dataUrl: string) {
		let newSelections = this.props.clipperState.selectionResult.data.htmlSelections;
		if (!newSelections) {
			newSelections = [];
		}
		newSelections.push(SelectionHelper.createHtmlForImgSrc(dataUrl));
		// TODO use lodash
		this.props.clipperState.setState({
			selectionResult: {
				status: Status.Succeeded,
				data: {
					mode: SelectionMode.Region,
					htmlSelections: newSelections
				}
			}
		});
	}

	/**
	 * They are selecting, update the second point
	 */
	private moveSelection(point: Point) {
		this.setState({ secondPoint: point });
	}

	/**
	 * Define the ending point, and notify the main UI
	 */
	private stopSelection(point: Point) {
		if (this.state.selectionInProgress) {
			if (!this.state.firstPoint || !this.state.secondPoint || this.state.firstPoint.x === this.state.secondPoint.x || this.state.firstPoint.y === this.state.secondPoint.y) {
				// Nothing to clip, start over
				this.resetState();
			} else {
				this.setState({ secondPoint: point, selectionInProgress: false });
				// Get the image immediately
				this.startRegionClip();
			}
		}
	}

	private mouseDownHandler(e: MouseEvent) {
		// Prevent default "dragging" which sometimes occurs
		e.preventDefault();
		this.startSelection({ x: e.pageX, y: e.pageY });
	}

	private mouseMoveHandler(e: MouseEvent) {
		if (this.state.selectionInProgress) {
			if (e.buttons === 0) {
				// They let go of the mouse while outside the window, stop the selection where they went out
				this.stopSelection(this.state.secondPoint);
				return;
			}

			this.moveSelection({ x: e.pageX, y: e.pageY });
		}
	}

	private mouseUpHandler(e: MouseEvent) {
		this.stopSelection({ x: e.pageX, y: e.pageY });
	}

	private touchStartHandler(e: TouchEvent) {
		let eventPoint = e.changedTouches[0];
		this.startSelection({ x: eventPoint.clientX, y: eventPoint.clientY });
	}

	private touchMoveHandler(e: TouchEvent) {
		if (this.state.selectionInProgress) {
			let eventPoint = e.changedTouches[0];
			this.moveSelection({ x: eventPoint.clientX, y: eventPoint.clientY });
			e.preventDefault();
		}
	}

	private touchEndHandler(e: TouchEvent) {
		let eventPoint = e.changedTouches[0];
		this.stopSelection({ x: eventPoint.clientX, y: eventPoint.clientY });
	}

	private handleResize() {
		this.setState({ winHeight: window.innerHeight, winWidth: window.innerWidth });
	}

	/**
	 * Update all of the frames and elements according to the selection
	 */
	private updateVisualElements() {
		let outerFrame: HTMLCanvasElement = this.refs.outerFrame as HTMLCanvasElement;
		if (!outerFrame) {
			return;
		}

		let xMin: number;
		let yMin: number;
		let xMax: number;
		let yMax: number;

		if (!this.state.firstPoint || !this.state.secondPoint) {
			xMin = 0;
			yMin = 0;
			xMax = 0;
			yMax = 0;
		} else {
			xMin = Math.min(this.state.firstPoint.x, this.state.secondPoint.x);
			yMin = Math.min(this.state.firstPoint.y, this.state.secondPoint.y);
			xMax = Math.max(this.state.firstPoint.x, this.state.secondPoint.x);
			yMax = Math.max(this.state.firstPoint.y, this.state.secondPoint.y);

			let innerFrame: HTMLCanvasElement = this.refs.innerFrame as HTMLCanvasElement;
			if (innerFrame) {
				// We don't worry about -1 values as they simply go offscreen neatly
				let borderWidth = 1;
				innerFrame.style.top = yMin - borderWidth + "px";
				innerFrame.style.left = xMin - borderWidth + "px";
				innerFrame.style.height = yMax - yMin + "px";
				innerFrame.style.width = xMax - xMin + "px";
			}
		}

		let winWidth = this.state.winWidth;
		let winHeight = this.state.winHeight;

		let context = outerFrame.getContext("2d");
		context.canvas.width = winWidth;
		context.canvas.height = winHeight;

		context.beginPath();
		context.fillStyle = "black";
		context.fillRect(0, 0, xMin, winHeight);
		context.fillRect(xMin, 0, xMax - xMin, yMin);
		context.fillRect(xMax, 0, winWidth - xMax, winHeight);
		context.fillRect(xMin, yMax, xMax - xMin, winHeight - yMax);
	}

	/**
	 * Get the browser to capture a screenshot, and save off the portion they selected (which may be compressed until it's below
	 * the maximum allowed size)
	 */
	private startRegionClip() {
		// Firefox reports this value incorrectly if this iframe is hidden, so store it now since we know we're visible
		this.devicePixelRatio = window.devicePixelRatio;

		let regionSelectionProcessingEvent = new Log.Event.BaseEvent(Log.Event.Label.RegionSelectionProcessing);
		let regionSelectionCapturingEvent = new Log.Event.BaseEvent(Log.Event.Label.RegionSelectionCapturing);
		regionSelectionCapturingEvent.setCustomProperty(Log.PropertyName.Custom.Width, Math.abs(this.state.firstPoint.x - this.state.secondPoint.x));
		regionSelectionCapturingEvent.setCustomProperty(Log.PropertyName.Custom.Height, Math.abs(this.state.firstPoint.y - this.state.secondPoint.y));

		Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.takeTabScreenshot, {
			callback: (dataUrl: string) => {
				Clipper.logger.logEvent(regionSelectionCapturingEvent);
				this.saveCompressedSelectionToState(dataUrl).then((canvas) => {
					regionSelectionProcessingEvent.setCustomProperty(Log.PropertyName.Custom.Width, canvas.width);
					regionSelectionProcessingEvent.setCustomProperty(Log.PropertyName.Custom.Height, canvas.height);
					Clipper.logger.logEvent(regionSelectionProcessingEvent);
				});
			}
		});
	}

	/**
	 * Given a base image in url form, captures the sub-image defined by the state's first and second points, compresses it if
	 * necessary, then saves it to state if the process was successful
	 */
	private saveCompressedSelectionToState(baseDataUrl: string): Promise<HTMLCanvasElement> {
		return this.createSelectionAsCanvas(baseDataUrl).then((canvas) => {
			let compressedSelection = this.getCompressedDataUrl(canvas);
			this.completeSelection(compressedSelection);
			return Promise.resolve(canvas);
		}).catch((error: Error) => {
			Clipper.logger.logFailure(Log.Failure.Label.RegionSelectionProcessing, Log.Failure.Type.Unexpected,
				{ error: error.message });
			this.resetState();
			return Promise.reject(error);
		});
	}

	/**
	 * Given a base image in url form, creates a canvas containing the sub-image defined by the state's first and second points
	 */
	private createSelectionAsCanvas(baseDataUrl: string): Promise<HTMLCanvasElement> {
		if (!baseDataUrl) {
			return Promise.reject(new Error("baseDataUrl should be a non-empty string, but was: " + baseDataUrl));
		}

		if (!this.state.firstPoint || !this.state.secondPoint) {
			return Promise.reject(new Error("Expected the two points to be set, but they were not"));
		}

		return new Promise<HTMLCanvasElement>((resolve) => {
			let regionSelectionLoadingEvent = new Log.Event.BaseEvent(Log.Event.Label.RegionSelectionLoading);
			let img: HTMLImageElement = new Image();

			img.onload = () => {
				Clipper.logger.logEvent(regionSelectionLoadingEvent);

				let xMin = Math.min(this.state.firstPoint.x, this.state.secondPoint.x);
				let yMin = Math.min(this.state.firstPoint.y, this.state.secondPoint.y);
				let xMax = Math.min(img.width, Math.max(this.state.firstPoint.x, this.state.secondPoint.x));
				let yMax = Math.min(img.height, Math.max(this.state.firstPoint.y, this.state.secondPoint.y));

				let destinationOffsetX = 0;
				let destinationOffsetY = 0;
				let width = (xMax - xMin);
				let height = (yMax - yMin);
				let sourceOffsetX = xMin * this.devicePixelRatio;
				let sourceOffsetY = yMin * this.devicePixelRatio;
				let sourceWidth = (xMax - xMin) * this.devicePixelRatio;
				let sourceHeight = (yMax - yMin) * this.devicePixelRatio;

				let canvas: HTMLCanvasElement = document.createElement("canvas") as HTMLCanvasElement;
				canvas.width = width;
				canvas.height = height;
				let ctx: CanvasRenderingContext2D = canvas.getContext("2d");
				ctx.drawImage(img, sourceOffsetX, sourceOffsetY, sourceWidth, sourceHeight, destinationOffsetX, destinationOffsetY, width, height);

				resolve(canvas);
			};

			img.src = baseDataUrl;
		});
	}

	/*
	 * Converts the canvas to a Base64 encoded URI, compressing it by lowering its quality if above the maxBytes threshold
	 */
	private getCompressedDataUrl(node: Node): string {
		let compressEvent = new Log.Event.BaseEvent(Log.Event.Label.CompressRegionSelection);

		let canvas: HTMLCanvasElement = node as HTMLCanvasElement;

		// First, see if the best quality PNG will work.
		let dataUrl: string = canvas.toDataURL("image/png");
		compressEvent.setCustomProperty(Log.PropertyName.Custom.InitialDataUrlLength, dataUrl.length);

		dataUrl = DomUtils.adjustImageQualityIfNecessary(canvas, dataUrl);

		compressEvent.setCustomProperty(Log.PropertyName.Custom.FinalDataUrlLength, dataUrl.length);
		Clipper.logger.logEvent(compressEvent);

		return dataUrl;
	}

	private getInnerFrame() {
		if (this.state.secondPoint) {
			return <div id={Constants.Ids.innerFrame} {...this.ref(Constants.Ids.innerFrame) }></div>;
		}

		return undefined;
	}

	render() {
		let innerFrameElement = this.getInnerFrame();

		return (
			<div config={this.updateVisualElements.bind(this)} id={Constants.Ids.regionSelectorContainer}
				onmousedown={this.mouseDownHandler.bind(this)} onmousemove={this.mouseMoveHandler.bind(this)}
				onmouseup={this.mouseUpHandler.bind(this)} ontouchstart={this.touchStartHandler.bind(this)}
				ontouchmove={this.touchMoveHandler.bind(this)} ontouchend={this.touchEndHandler.bind(this)}>
				<canvas id={Constants.Ids.outerFrame} {...this.ref(Constants.Ids.outerFrame)}></canvas>
				{innerFrameElement}
			</div>
		);
	}
}

let component = RegionSelectorClass.componentize();
export {component as RegionSelector};
