/// <reference path="../../../../typings/main/ambient/velocity-animate/velocity-animate.d.ts"/>
declare var Velocity: jquery.velocity.VelocityStatic;

import {SmartValue} from "../../communicator/smartValue";

import {AnimationState} from "./animationState";
import {TransitioningAnimationStrategy, TransitioningAnimationStrategyOptions} from "./transitioningAnimationStrategy";

/**
 *
 */
export class SlideContentInFromTopAnimationStrategy extends TransitioningAnimationStrategy<TransitioningAnimationStrategyOptions> {

	// TODO add animationState to Options
	constructor(options?: TransitioningAnimationStrategyOptions, animationState?: SmartValue<AnimationState>) {
		super(367 /* animationDuration */, options, animationState);
	}

	protected doAnimateIn(parentEl: HTMLElement): Promise<void>  {
		return new Promise<void>((resolve) => {
			// TODO children-to-animate class names should be settable by user
			let childrenSelectors = [".dialogButton .wideButtonContainer", ".messageLabel"];
			let selectors: string = childrenSelectors.join(", ");
			let translations = ["-48px", "-48px", "-50px"]; // bottom to top; TODO ensure this is equal to length of animatables
			let delays = [0, 50, 33]; // bottom to top; TODO ensure this is equal to length of animatables

			let animatables: NodeListOf<HTMLElement> = parentEl.querySelectorAll(selectors) as NodeListOf<HTMLElement>;

			for (let aIndex = animatables.length - 1; aIndex >= 0; aIndex--) {
				let item = animatables[aIndex];

				// apply style to each animatable
				item.style.top = translations[aIndex];
				item.style.opacity = "0";

				Velocity.animate(item, {
					top: 0,
					opacity: [1, "linear"]
				}, {
					complete: () => {
						if (aIndex === 0) {
							resolve();
						}
					},
					delay: delays[aIndex],
					duration: this.animationDuration,
					easing: [ 0, 0, 0, 1 ] // TODO settable by user?
				});
			}
		});
	}

	protected doAnimateOut(parentEl: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			// TODO children-to-animate class names should be settable by user
			let childrenSelectors = [".dialogButton .wideButtonContainer", ".messageLabel"];
			let selectors: string = childrenSelectors.join(", ");

			let animatables: NodeListOf<HTMLElement> = parentEl.querySelectorAll(selectors) as NodeListOf<HTMLElement>;

			let verticalEndValue = -23;

			Velocity.animate(animatables, {
				top: verticalEndValue,
				opacity: [0, "linear"]
			}, {
				complete: () => {
					resolve();
				},
				duration: 267, // TODO not hardcoded
				easing: [1, 0, 1, 1] // TODO set-able by user?
			});
		});
	}

	protected intShouldAnimateIn(el: HTMLElement): boolean {
		let shouldAnimateIn: boolean = this.getAnimationState() === AnimationState.Out;
		console.log("intShouldAnimateIn", AnimationState[this.getAnimationState()], shouldAnimateIn);
		return shouldAnimateIn;
	}

	protected intShouldAnimateOut(el: HTMLElement): boolean {
		let shouldAnimateOut: boolean = this.getAnimationState() === AnimationState.In;
		console.log("intShouldAnimateOut", AnimationState[this.getAnimationState()], shouldAnimateOut);
		return shouldAnimateOut;
	}
}
