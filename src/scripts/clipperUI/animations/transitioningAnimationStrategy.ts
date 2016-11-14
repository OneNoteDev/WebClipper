declare var Velocity: jquery.velocity.VelocityStatic;

import {ObjectUtils} from "../../objectUtils";

import {SmartValue} from "../../communicator/smartValue";

import {AnimationHelper} from "./animationHelper";
import {AnimationState} from "./animationState";
import {AnimationStrategy} from "./animationStrategy";

export interface TransitioningAnimationStrategyOptions {
	extShouldAnimateIn: () => boolean;
	extShouldAnimateOut: () => boolean;

	onBeforeAnimateOut?: (el: HTMLElement) => void;
	onBeforeAnimateIn?: (el: HTMLElement) => void;

	onAfterAnimateOut?: (el: HTMLElement) => void;
	onAfterAnimateIn?: (el: HTMLElement) => void;
}

/**
 * Represents the family of animations where elements are able to toggle their visibility completely.
 *
 * Assumes that the decision to animate out vs animate in is relient on both external and internal
 * factors. Implementing classes will implement the internal factors, but can leave room for external
 * factors to weigh in on the decision as well.
 */
export abstract class TransitioningAnimationStrategy<TOptions extends TransitioningAnimationStrategyOptions> extends AnimationStrategy {
	protected options: TOptions;

	constructor(animationDuration: number, options: TOptions, animationState?: SmartValue<AnimationState>) {
		animationState = animationState || new SmartValue<AnimationState>();

		if (ObjectUtils.isNullOrUndefined(animationState.get())) {
			animationState.set(AnimationState.Out);
		}

		super(animationDuration, animationState);
		this.options = options;
	}

	protected abstract doAnimateIn(el: HTMLElement): Promise<void>;
	protected abstract doAnimateOut(el: HTMLElement): Promise<void>;
	protected abstract intShouldAnimateIn(el: HTMLElement): boolean;
	protected abstract intShouldAnimateOut(el: HTMLElement): boolean;

	// Override
	public animate(el: HTMLElement) {
		// We only stop animations when we actually animate, so we call stopAnimationsThen
		// in the animateIn and animateOut functions instead of here
		this.doAnimate(el);
	}

	protected doAnimate(el: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			if (this.options.extShouldAnimateIn() && this.intShouldAnimateIn(el)) {
				this.animateIn(el).then(() => {
					resolve();
				});
			} else if (this.options.extShouldAnimateOut() && this.intShouldAnimateOut(el)) {
				this.animateOut(el).then(() => {
					resolve();
				});
			}
		});
	}

	private animateIn(el: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			AnimationHelper.stopAnimationsThen(el, () => {
				if (this.options.onBeforeAnimateIn) {
					this.options.onBeforeAnimateIn(el);
				}
				this.setAnimationState(AnimationState.GoingIn);
				this.doAnimateIn(el).then(() => {
					this.setAnimationState(AnimationState.In);
					if (this.options.onAfterAnimateIn) {
						this.options.onAfterAnimateIn(el);
					}
					resolve();
				});
			});
		});
	}

	private animateOut(el: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			AnimationHelper.stopAnimationsThen(el, () => {
				if (this.options.onBeforeAnimateOut) {
					this.options.onBeforeAnimateOut(el);
				}
				this.setAnimationState(AnimationState.GoingOut);
				this.doAnimateOut(el).then(() => {
					this.setAnimationState(AnimationState.Out);
					if (this.options.onAfterAnimateOut) {
						this.options.onAfterAnimateOut(el);
					}
					resolve();
				});
			});
		});
	}
}
