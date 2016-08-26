import {AnimationHelper} from "./animationHelper";
import {AnimationState} from "./animationState";

/**
 * Represents a strategy object for handling the animations for the given element.
 * Child classes should only have to implement the animation itself, as well as any
 * additional functional requirements, such as callbacks.
 */
export abstract class AnimationStrategy {
	protected animationDuration: number;
	protected animationState: AnimationState;

	constructor(animationDuration: number) {
		this.animationDuration = animationDuration;
		this.animationState = AnimationState.Stopped;
	}

	protected abstract doAnimate(el: HTMLElement): Promise<void>;

	public getAnimationState(): AnimationState {
		return this.animationState;
	}

	public setAnimationState(animationState: AnimationState) {
		this.animationState = animationState;
	}

	public animate(el: HTMLElement) {
		AnimationHelper.stopAnimationsThen(el, () => {
			this.animationState = AnimationState.Transitioning;
			this.doAnimate(el).then(() => {
				this.animationState = AnimationState.Stopped;
			});
		});
	}
}
