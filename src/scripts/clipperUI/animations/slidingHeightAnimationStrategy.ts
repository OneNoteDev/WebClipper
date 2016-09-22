declare var Velocity: jquery.velocity.VelocityStatic;

import {Constants} from "../../constants";

import {AnimationStrategy} from "./animationStrategy";

export interface SlidingHeightAnimationStrategyOptions {
	onBeforeHeightAnimatorDraw?: (newHeightInfo: NewHeightInfo) => void;
	onAfterHeightAnimatorDraw?: (newHeightInfo: NewHeightInfo) => void;
}

export interface NewHeightInfo {
	actualPanelHeight: number;
	newContainerHeight: number;
	newPanelHeight: number;
}

/**
 * Represents an animation where element are able to adjust their height by performing
 * a 'slide' animation.
 */
export class SlidingHeightAnimationStrategy extends AnimationStrategy {
	private containerId: string;
	private options: SlidingHeightAnimationStrategyOptions;

	constructor(containerId: string, options?: SlidingHeightAnimationStrategyOptions) {
		super(200 /* animationDuration */);
		this.containerId = containerId;
		this.options = options;
	}

	protected doAnimate(el: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			let container = document.getElementById(this.containerId);
			let newHeightInfo: NewHeightInfo = this.getContainerTrueHeight(container, el);

			if (this.options.onBeforeHeightAnimatorDraw) {
				this.options.onBeforeHeightAnimatorDraw(newHeightInfo);
			}

			// If there's nothing to animate then call it good.
			if (newHeightInfo.actualPanelHeight === newHeightInfo.newPanelHeight) {
				resolve();
				return;
			}

			let delayResize = newHeightInfo.actualPanelHeight > newHeightInfo.newPanelHeight;
			if (!delayResize && this.options.onAfterHeightAnimatorDraw) {
				this.options.onAfterHeightAnimatorDraw(newHeightInfo);
			}

			Velocity.animate(el, {
				maxHeight: newHeightInfo.newPanelHeight,
				minHeight: newHeightInfo.newPanelHeight
			}, {
				complete: () => {
					if (delayResize && this.options.onAfterHeightAnimatorDraw) {
						this.options.onAfterHeightAnimatorDraw(newHeightInfo);
					}
					resolve();
				},
				duration: this.animationDuration,
				easing: "easeOutQuad"
			});
		});
	}

	private getContainerTrueHeight(container: HTMLElement, heightAnimator: HTMLElement): NewHeightInfo {
		let actualPanelHeight = parseFloat(heightAnimator.style.maxHeight.replace("px", ""));
		if (isNaN(actualPanelHeight)) {
			actualPanelHeight = 0;
		}

		// Temporarily remove these so we can calculate the destination heights.
		heightAnimator.style.maxHeight = "";
		heightAnimator.style.minHeight = "";

		// At this point the new container size has been set, so we need to grab it so that we know where to animate to.
		let newContainerHeight = container ? container.offsetHeight : 0;
		let newPanelHeight = heightAnimator.offsetHeight;

		// Now set to the height back to what it was so that there is something to animate from.
		heightAnimator.style.maxHeight = actualPanelHeight + "px";
		heightAnimator.style.minHeight = actualPanelHeight + "px";
		return { actualPanelHeight: actualPanelHeight, newContainerHeight: newContainerHeight, newPanelHeight: newPanelHeight };
	}
}
