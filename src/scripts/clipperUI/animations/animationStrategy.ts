import {SmartValue} from "../../communicator/smartValue";

import {AnimationHelper} from "./animationHelper";
import {AnimationState} from "./animationState";

/**
 * Represents a strategy object for handling the animations for the given element.
 * Child classes should only have to implement the animation itself, as well as any
 * additional functional requirements, such as callbacks.
 */
export abstract class AnimationStrategy {
	protected animationDuration: number;

	private animationState: SmartValue<AnimationState>; // TODO avoid SV if possible; maybe this shouldn't be owned by animationStrategy anymore...

	constructor(animationDuration: number, animationState?: SmartValue<AnimationState>) {
		this.animationDuration = animationDuration;
		this.animationState = animationState || new SmartValue<AnimationState>(AnimationState.Stopped);
	}

	protected abstract doAnimate(el: HTMLElement): Promise<void>;

	public getAnimationState(): AnimationState {
		return this.animationState.get();
	}

	public setAnimationState(animationState: AnimationState) {
		this.animationState.set(animationState);
	}

	public animate(el: HTMLElement) {
		AnimationHelper.stopAnimationsThen(el, () => {
			this.setAnimationState(AnimationState.Transitioning);
			this.doAnimate(el).then(() => {
				this.setAnimationState(AnimationState.Stopped);
			});
		});
	}
}
