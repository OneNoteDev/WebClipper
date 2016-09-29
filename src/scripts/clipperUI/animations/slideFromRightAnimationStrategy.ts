/// <reference path="../../../../typings/main/ambient/velocity-animate/velocity-animate.d.ts"/>
declare var Velocity: jquery.velocity.VelocityStatic;

import {AnimationState} from "./animationState";
import {TransitioningAnimationStrategy, TransitioningAnimationStrategyOptions} from "./transitioningAnimationStrategy";

/**
 * Represents an animation where elements transition in by sliding from the right.
 * When transitioning out, elements slide off to the left. The optional callbacks
 * should be used to load in a 'next state' for an element transition after the previous
 * one has been transitioned out.
 */
export class SlideFromRightAnimationStrategy extends TransitioningAnimationStrategy<TransitioningAnimationStrategyOptions> {
	private reverseChildAnimations: boolean;

	constructor(options?: TransitioningAnimationStrategyOptions) {
		super(200 /* animationDuration */, options);
		this.reverseChildAnimations = true;
	}

	protected doAnimateIn(el: HTMLElement): Promise<void>  {
		return new Promise<void>((resolve) => {
			let horizontalBeginValue = this.reverseChildAnimations ? 20 : -20;
			el.style.left = horizontalBeginValue + "px";
			el.style.opacity = "0";

			Velocity.animate(el, {
				left: 0,
				opacity: 1
			}, {
				complete: () => {
					resolve();
				},
				duration: this.animationDuration,
				easing: "easeInOutQuad"
			});
		});
	}

	protected doAnimateOut(el: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			let horizontalEndValue = this.reverseChildAnimations ? -20 : 20;

			Velocity.animate(el, {
				left: horizontalEndValue,
				opacity: 0
			}, {
				complete: () => {
					resolve();
				},
				duration: this.animationDuration,
				easing: "easeInOutQuad"
			});
		});
	}

	protected intShouldAnimateIn(el: HTMLElement): boolean {
		return this.getAnimationState() === AnimationState.Out;
	}

	protected intShouldAnimateOut(el: HTMLElement): boolean {
		return this.getAnimationState() === AnimationState.In;
	}
}
