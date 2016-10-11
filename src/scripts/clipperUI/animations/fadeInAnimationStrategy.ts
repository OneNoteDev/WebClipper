declare var Velocity: jquery.velocity.VelocityStatic;

import {AnimationState} from "./animationState";
import {TransitioningAnimationStrategy, TransitioningAnimationStrategyOptions} from "./transitioningAnimationStrategy";

/**
 * Represents an animation where elements fade in.
 * When transitioning out, elements fade away.
 */
export class FadeInAnimationStrategy extends TransitioningAnimationStrategy<TransitioningAnimationStrategyOptions> {

	constructor(options?: TransitioningAnimationStrategyOptions) {
		super(200 /* animationDuration */, options);
	}

	protected doAnimateIn(el: HTMLElement): Promise<void>  {
		return new Promise<void>((resolve) => {
			el.style.opacity = "0";

			Velocity.animate(el, {
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
			Velocity.animate(el, {
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
