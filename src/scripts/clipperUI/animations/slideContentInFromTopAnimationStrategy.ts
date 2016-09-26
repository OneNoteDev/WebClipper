/// <reference path="../../../../typings/main/ambient/velocity-animate/velocity-animate.d.ts"/>
declare var Velocity: jquery.velocity.VelocityStatic;

import {AnimationState} from "./animationState";
import {TransitioningAnimationStrategy, TransitioningAnimationStrategyOptions} from "./transitioningAnimationStrategy";

/**
 *
 */
export class SlideContentInFromTopAnimationStrategy extends TransitioningAnimationStrategy<TransitioningAnimationStrategyOptions> {

	constructor(options?: TransitioningAnimationStrategyOptions) {
		super(400 /* animationDuration */, options);
	}

	protected doAnimateIn(parentEl: HTMLElement): Promise<void>  {
		return new Promise<void>((resolve) => {
			// TODO children-to-animate class names should be settable by user
			let childrenClasses = ["dialogButton", "messageLabel"];
			let selectors: string = ".dialogButton .wideButtonContainer, .messageLabel";

			let animatables: NodeListOf<HTMLElement> = parentEl.querySelectorAll(selectors) as NodeListOf<HTMLElement>;

			Array.prototype.forEach.call(animatables, function (item) {
				// apply style to each animatable
				item.style.top = "-20px";
				item.style.opacity = "0";
			});

			Velocity.animate(animatables, {
				top: 0,
				opacity: 1
			}, {
				complete: () => {
					resolve();
				},
				duration: this.animationDuration,
				easing: [ 0.4, 0, 0.3, 1 ] // TODO settable by user?
			});
		});
	}

	protected doAnimateOut(el: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			let verticalEndValue = 20;

			Velocity.animate(el, {
				top: verticalEndValue,
				opacity: 0
			}, {
				complete: () => {
					resolve();
				},
				duration: this.animationDuration,
				easing: [1, 0, 1, 1] // TODO set-able by user?
			});
		});
	}

	protected intShouldAnimateIn(el: HTMLElement): boolean {
		return this.animationState === AnimationState.Out;
	}

	protected intShouldAnimateOut(el: HTMLElement): boolean {
		return this.animationState === AnimationState.In;
	}
}
