import {ComponentBase} from "../componentBase";
import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";

/**
 * Sequences images into an animation from a vertical sprite sheet
 */

export interface SpriteAnimationProps {
	shouldTakeFocus?: boolean;
	spriteUrl: string;
	imageHeight: number;
	imageWidth?: number;
	totalFrameCount: number;
	loop?: boolean;
	ariaLabel?: string;
}

export interface SpriteAnimationState {
	inProgress: boolean;
}

class SpriteAnimationClass extends ComponentBase<SpriteAnimationState, SpriteAnimationProps> {
	private currentFrame = 0;
	private currentTime = this.rightNow();
	private spinnerElement: HTMLDivElement;

	initiallySetFocus(element: HTMLElement) {
		if (this.props.shouldTakeFocus) {
			element.focus();
		}
	}

	getInitialState(): SpriteAnimationState {
		requestAnimationFrame(() => {
			this.updateFrame();
		});

		return {
			inProgress: true
		};
	}

	updateFrame() {
		if (!this.spinnerElement) {
			this.stop();
			return;
		}

		if (!this.state.inProgress) {
			return;
		}

		let time = this.rightNow();
		let fps = 24;
		let delta = (time - this.currentTime) / 1000;
		this.currentTime = time;

		this.currentFrame += (delta * fps);
		let frameNumber = Math.floor(this.currentFrame);
		if (frameNumber >= this.props.totalFrameCount) {
			this.onFinishLoop();

			if (this.props.loop) {
				frameNumber = this.currentFrame = 0;
			} else {
				this.stop();
				frameNumber = this.currentFrame = this.props.totalFrameCount - 1;
			}
		}

		let backgroundPosition = (frameNumber * this.props.imageHeight);
		this.spinnerElement.style.backgroundPosition = "0 -" + backgroundPosition + "px";
		requestAnimationFrame(() => {
			this.updateFrame();
		});
	}

	stop() {
		this.setState({ inProgress: false });
	}

	/**
	 * Fires when the animation finishes its loop
	 * Note: Intended to be overwritten as an event handler
	 */
	onFinishLoop() {
		////console.log("onFinishLoop");
	}

	/**
	 * If window.performance exists, then use window.performance.now since it is faster,
	 * else use Date.now()
	 */
	rightNow(): number {
		if (window.performance && window.performance.now) {
			return window.performance.now();
		} else {
			return Date.now();
		}
	}

	configForSpinner(element: HTMLDivElement, isInitialized: boolean, context: any) {
		this.spinnerElement = element;
		if (!isInitialized) {
			this.initiallySetFocus(element);
		}
		context.onunload = () => {
			this.stop();
		};
	}

	render() {
		let imageWidth = this.props.imageWidth ? this.props.imageWidth : 32;

		let ariaLabel = this.props.ariaLabel ? this.props.ariaLabel : Localization.getLocalizedString("WebClipper.Accessibility.ScreenReader.Loading");

		let style = {
			backgroundImage: "url(" + this.props.spriteUrl + ")",
			backgroundRepeat: "no-repeat",
			height: this.props.imageHeight + "px",
			width: imageWidth + "px"
		};

		return (
			<div
				className={Constants.Classes.spinner}
				config={this.configForSpinner.bind(this)}
				style={style}
				tabIndex="290"
				aria-label={ariaLabel}
				role="progressbar"
				aria-valuemin="0"
				aria-valuemax="100" />
		);
	}
}

let component = SpriteAnimationClass.componentize();
export {component as SpriteAnimation};
