import {DomUtils} from "../domParsers/domUtils";

import * as Log from "../logging/log";

import {Constants} from "../constants";
import {ClientType} from "../clientType";
import {Status} from "./status";

import {ClipperStateProp} from "./clipperState";
import {ComponentBase} from "./componentBase";
import {Clipper} from "./frontEndGlobals";
import {ExtensionUtils} from "../extensions/extensionUtils";
import {Localization} from "../localization/localization";

export interface Point {
	x: number;
	y: number;
};

interface RegionSelectorState {
	firstPoint?: Point;
	secondPoint?: Point;
	mousePosition?: Point;
	selectionInProgress?: boolean;
	keyboardSelectionInProgress?: boolean;
	winWidth?: number;
	winHeight?: number;
	ariaLiveMessage?: string;
}

class RegionSelectorClass extends ComponentBase<RegionSelectorState, ClipperStateProp> {
	private devicePixelRatio: number = 1;
	private cursorSpeed: number = 1;

	private resizeHandler = this.handleResize.bind(this);
	private mouseMovementHandler = this.globalMouseMoveHandler.bind(this);
	private mouseOverHandler = this.globalMouseOverHandler.bind(this);
	private keyDownDict: { [key: number]: boolean } = {};
	private lastAnnouncementTime: number = 0;
	private announcementThrottleMs: number = 500; // Throttle announcements to every 500ms

	getInitialState(): RegionSelectorState {
		return {
			selectionInProgress: false,
			keyboardSelectionInProgress: false,
			winHeight: window.innerHeight,
			winWidth: window.innerWidth,
			mousePosition: {x: window.innerWidth / 2, y: window.innerHeight / 2}
		};
	}

	constructor(props: ClipperStateProp) {
		super(props);
		this.resetState();

		window.addEventListener("resize", this.resizeHandler);
		window.addEventListener("mousemove", this.mouseMovementHandler);
		window.addEventListener("mouseover", this.mouseOverHandler);
	}

	private onunload() {
		window.removeEventListener("resize", this.resizeHandler);
		window.removeEventListener("mousemove", this.mouseMovementHandler);
		window.removeEventListener("mouseover", this.mouseOverHandler);
	}

	/**
	 * Start the selection process over
	 */
	private resetState() {
		this.setState({ firstPoint: undefined, secondPoint: undefined, selectionInProgress: false, keyboardSelectionInProgress: false});
		this.props.clipperState.setState({ regionResult: { status: Status.NotStarted, data: this.props.clipperState.regionResult.data } });
	}

	/**
	 * Define the starting point for the selection
	 */
	private startSelection(point: Point, fromKeyboard = false) {
		if (this.props.clipperState.regionResult.status !== Status.InProgress) {
			this.setState({ firstPoint: point, secondPoint: undefined, selectionInProgress: true, keyboardSelectionInProgress: fromKeyboard });
			this.props.clipperState.setState({ regionResult: { status: Status.InProgress, data: this.props.clipperState.regionResult.data } });
		}
	}

	/**
	 * The selection is complete
	 */
	private completeSelection(dataUrl: string) {
		let regionList = this.props.clipperState.regionResult.data;
		if (!regionList) {
			regionList = [];
		}
		regionList.push(dataUrl);
		this.props.clipperState.setState({ regionResult: { status: Status.Succeeded, data: regionList } });
	}

	/**
	 * They are selecting, update the second point
	 */
	private moveSelection(point: Point) {
		this.setState({ secondPoint: point });
	}

	/**
	 * Update Mouse Position for custom cursor
	 */
	private setMousePosition(point: Point) {
		this.setState({ mousePosition: point});
	}

	/**
	 * Announce screen reader message for keyboard navigation (polite, throttled)
	 */
	private announceAriaLiveMessage(message: string) {
		const now = Date.now();
		// Throttle direction announcements to avoid overwhelming the screen reader
		if (now - this.lastAnnouncementTime >= this.announcementThrottleMs) {
			this.setState({ ariaLiveMessage: message });
			this.lastAnnouncementTime = now;
		}
	}

	/**
	 * Get the direction message for screen reader based on key presses
	 */
	private getDirectionMessage(): string {
		let directions: string[] = [];

		if (this.keyDownDict[Constants.KeyCodes.up]) {
			directions.push(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.Up"));
		}
		if (this.keyDownDict[Constants.KeyCodes.down]) {
			directions.push(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.Down"));
		}
		if (this.keyDownDict[Constants.KeyCodes.left]) {
			directions.push(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.Left"));
		}
		if (this.keyDownDict[Constants.KeyCodes.right]) {
			directions.push(Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.Right"));
		}

		return directions.join(" ");
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
				this.setState({ secondPoint: point, selectionInProgress: false, keyboardSelectionInProgress: false });

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

	private keyDownHandler(e: KeyboardEvent) {
		this.keyDownDict[e.which] = true;

		if (e.which === Constants.KeyCodes.enter ) {
			if (!this.state.selectionInProgress) {
				this.startSelection({ x: this.state.mousePosition.x, y: this.state.mousePosition.y }, true /* fromKeyboard */);
			} else {
				this.stopSelection({ x: this.state.mousePosition.x, y: this.state.mousePosition.y });
			}
			e.preventDefault();
		} else if (e.which === Constants.KeyCodes.up
				|| e.which === Constants.KeyCodes.down
				|| e.which === Constants.KeyCodes.left
				|| e.which === Constants.KeyCodes.right) {

			let delta: Point = {x: 0, y: 0};

			if (this.keyDownDict[Constants.KeyCodes.up]) {
				delta.y -= this.cursorSpeed;
			}

			if (this.keyDownDict[Constants.KeyCodes.down]) {
				delta.y += this.cursorSpeed;
			}

			if (this.keyDownDict[Constants.KeyCodes.left]) {
				delta.x -= this.cursorSpeed;
			}

			if (this.keyDownDict[Constants.KeyCodes.right]) {
				delta.x += this.cursorSpeed;
			}

			let newPosition: Point = {x: Math.max(Math.min(this.state.mousePosition.x + delta.x, this.state.winWidth), 0), y: Math.max(Math.min(this.state.mousePosition.y + delta.y, this.state.winHeight), 0)};

			this.setMousePosition(newPosition);

			// Announce direction for screen readers
			let directionMessage = this.getDirectionMessage();
			if (directionMessage) {
				this.announceAriaLiveMessage(directionMessage);
			}

			if (this.state.selectionInProgress) {
				this.moveSelection(newPosition);
			}

			if (this.cursorSpeed < 5) {
				this.cursorSpeed++;
			}

			e.preventDefault();
		}
	}

	private keyUpHandler(e: KeyboardEvent) {
		this.keyDownDict[e.which] = false;
		if (e.which === Constants.KeyCodes.up
			|| e.which === Constants.KeyCodes.down
			|| e.which === Constants.KeyCodes.left
			|| e.which === Constants.KeyCodes.right) {
			this.cursorSpeed = 1;
		}
	}

	private globalMouseMoveHandler(e: MouseEvent) {
		this.setMousePosition({ x: e.pageX, y: e.pageY });
	}

	private globalMouseOverHandler(e: MouseEvent) {
		window.removeEventListener("mouseover", this.mouseOverHandler);
		this.setMousePosition({ x: e.pageX, y: e.pageY });
	}

	private mouseMoveHandler(e: MouseEvent) {
		if (this.state.selectionInProgress) {
			if (e.buttons === 0 && !this.state.keyboardSelectionInProgress) {
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
	private updateVisualElements(element: HTMLElement, isInitialized: boolean) {
		let outerFrame: HTMLCanvasElement = this.refs.outerFrame as HTMLCanvasElement;
		if (!outerFrame) {
			return;
		}

		let cursor: HTMLImageElement = this.refs.cursor as HTMLImageElement;
		if (cursor) {
			cursor.style.left = this.state.mousePosition.x + "px";
			cursor.style.top = this.state.mousePosition.y + "px";
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

		if (!isInitialized) {
			element.focus();
		}
	}

	/**
	 * Get the browser to capture a screenshot, and save off the portion they selected (which may be compressed until it's below
	 * the maximum allowed size)
	 */
	private startRegionClip() {
		// Taken from https://www.kirupa.com/html5/detecting_retina_high_dpi.htm
		// We check this here so that we can log it as a custom property on the regionSelectionProcessingEvent
		const query = "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
		const isHighDpiScreen = matchMedia(query).matches;
		const isFirefoxWithHighDpiDisplay = this.props.clipperState.clientInfo.clipperType === ClientType.FirefoxExtension && isHighDpiScreen;

		// Firefox reports this value incorrectly if this iframe is hidden, so store it now since we know we're visible
		// In addition to this, Firefox currently has a bug where they are not using devicePixelRatio correctly 
		// on HighDPI screens such as Retina screens or the Surface Pro 4
		// Bug link: https://bugzilla.mozilla.org/show_bug.cgi?id=1278507 
		this.devicePixelRatio = isFirefoxWithHighDpiDisplay ? window.devicePixelRatio / 2 : window.devicePixelRatio;

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
					regionSelectionProcessingEvent.setCustomProperty(Log.PropertyName.Custom.IsHighDpiScreen, isHighDpiScreen);
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

		const devicePixelRatio = this.devicePixelRatio;

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
				let sourceOffsetX = xMin * devicePixelRatio;
				let sourceOffsetY = yMin * devicePixelRatio;
				let sourceWidth = (xMax - xMin) * devicePixelRatio;
				let sourceHeight = (yMax - yMin) * devicePixelRatio;

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
			<div tabindex="1" config={this.updateVisualElements.bind(this)} id={Constants.Ids.regionSelectorContainer}
				aria-label={Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.RegionSelectionCanvas")} role="application"
				onmousedown={this.mouseDownHandler.bind(this)} onmousemove={this.mouseMoveHandler.bind(this)}
				onmouseup={this.mouseUpHandler.bind(this)} ontouchstart={this.touchStartHandler.bind(this)}
				ontouchmove={this.touchMoveHandler.bind(this)} ontouchend={this.touchEndHandler.bind(this)}
				onkeydown={this.keyDownHandler.bind(this)} onkeyup={this.keyUpHandler.bind(this)}>
				<div aria-live="polite" aria-atomic="true" className={Constants.Classes.srOnly}>
					{this.state.ariaLiveMessage}
				</div>
				<img id="cursor"  {...this.ref("cursor")} src={ExtensionUtils.getImageResourceUrl("crosshair_cursor.svg")}
					width={Constants.Styles.customCursorSize + "px"} height={Constants.Styles.customCursorSize + "px"} />
				<canvas id={Constants.Ids.outerFrame} {...this.ref(Constants.Ids.outerFrame)}></canvas>
				{innerFrameElement}
			</div>
		);
	}
}

let component = RegionSelectorClass.componentize();
export {component as RegionSelector};
