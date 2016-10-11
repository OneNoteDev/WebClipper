declare var Velocity: jquery.velocity.VelocityStatic;

import {Constants} from "../../constants";

import {AnimationState} from "./animationState";
import {AnimationStrategy} from "./animationStrategy";
import {TransitioningAnimationStrategy, TransitioningAnimationStrategyOptions} from "./transitioningAnimationStrategy";

export interface ExpandFromRightAnimationStrategyOptions extends TransitioningAnimationStrategyOptions {
	onAnimateInExpand?: (el: HTMLElement) => void;
}

/**
 * Represents an animation where elements transition in by expanding from the top right.
 * When transitioning out, the opposite happens.
 */
export class ExpandFromRightAnimationStrategy extends TransitioningAnimationStrategy<ExpandFromRightAnimationStrategyOptions> {
	private animationTimeout: number;
	private animationTimeoutId: number;
	private reverseChildAnimations: boolean;

	constructor(options?: ExpandFromRightAnimationStrategyOptions) {
		super(500 /* animationDuration */, options);
		this.animationTimeout = 100;
		this.reverseChildAnimations = true;
	}

	protected doAnimateIn(el: HTMLElement) {
		return new Promise<void>((resolve) => {
			this.reverseChildAnimations = true;

			clearTimeout(this.animationTimeoutId);
			if (this.options.onAnimateInExpand) {
				this.animationTimeoutId = setTimeout(() => {
					this.options.onAnimateInExpand(el);
				}, this.animationTimeout);
			}

			Velocity.animate(el, {
				opacity: 1,
				right: 20,
				width: Constants.Styles.clipperUiWidth
			}, {
				complete: () => {
					// The first transition is reversed; once it is done, do the normal transitions
					this.reverseChildAnimations = false;
					resolve();
				},
				duration: this.animationDuration,
				easing: "easeOutExpo"
			});
		});
	}

	protected doAnimateOut(el: HTMLElement) {
		return new Promise<void>((resolve) => {
			clearTimeout(this.animationTimeoutId);
			this.animationTimeoutId = setTimeout(() => {
				Velocity.animate(el, {
					opacity: 0,
					right: 0,
					width: 0
				}, {
					complete: () => {
						resolve();
					},
					duration: this.animationDuration,
					easing: "easeOutExpo"
				});
			}, this.animationTimeout);
		});
	}

	protected intShouldAnimateIn(el: HTMLElement): boolean {
		return this.getAnimationState() === AnimationState.GoingOut || this.getAnimationState() === AnimationState.Out;
	}

	protected intShouldAnimateOut(el: HTMLElement): boolean {
		return this.getAnimationState() === AnimationState.GoingIn || this.getAnimationState() === AnimationState.In;
	}
}
