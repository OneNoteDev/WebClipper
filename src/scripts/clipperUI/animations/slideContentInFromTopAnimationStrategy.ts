/// <reference path="../../../../typings/main/ambient/velocity-animate/velocity-animate.d.ts"/>
declare var Velocity: jquery.velocity.VelocityStatic;

import {SmartValue} from "../../communicator/smartValue";

import {AnimationState} from "./animationState";
import {TransitioningAnimationStrategy, TransitioningAnimationStrategyOptions} from "./transitioningAnimationStrategy";

export interface SlideContentInFromTopAnimationStrategyOptions extends TransitioningAnimationStrategyOptions {
	animationState: SmartValue<AnimationState>;
	contentToAnimate: ContentToAnimate[];
}

export interface ContentToAnimate {
	selector: string;
	animateInOptions: AnimateInOptions;
}

export interface AnimateInOptions {
	verticalDeltas: number[];
	delaysInMs: number[];
}

/**
 *
 */
export class SlideContentInFromTopAnimationStrategy extends TransitioningAnimationStrategy<TransitioningAnimationStrategyOptions> {
	private animateOutDuration: number;
	private animateInDuration: number;
	private contentToAnimate: ContentToAnimate[];

	constructor(options?: SlideContentInFromTopAnimationStrategyOptions) {
		super(undefined /* animationDuration */, options, options.animationState);

		this.animateInDuration = 367;
		this.animateOutDuration = 267;
		this.contentToAnimate = options.contentToAnimate;
	}

	protected doAnimateIn(parentEl: HTMLElement): Promise<void>  {
		return new Promise<void>((resolve) => {
			for (let cIndex = 0; cIndex < this.contentToAnimate.length; cIndex++) {
				let content = this.contentToAnimate[cIndex];
				let animatables = parentEl.querySelectorAll(content.selector) as NodeListOf<HTMLElement>;

				for (let aIndex = 0; aIndex < animatables.length; aIndex++) {
					let item: HTMLElement = animatables[aIndex];

					console.log("top:", -(content.animateInOptions.verticalDeltas[aIndex]) + "px", "delay:", content.animateInOptions.delaysInMs[aIndex], item);

					// apply style to each animatable
					item.style.top = -(content.animateInOptions.verticalDeltas[aIndex]) + "px";
					item.style.opacity = "0";

					Velocity.animate(item, {
					top: 0,
					opacity: [1, "linear"]
					}, {
						complete: () => {
							if ((cIndex === this.contentToAnimate.length - 1) && (aIndex === animatables.length - 1)) {
								resolve();
							}
						},
						delay: content.animateInOptions.delaysInMs[aIndex],
						duration: this.animateInDuration,
						easing: [ 0, 0, 0, 1 ]
					});
				}
			}
		});
	}

	protected doAnimateOut(parentEl: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			let childrenSelectors: string = this.contentToAnimate.map((content) => { return content.selector; }).join(", ");
			let animatables: NodeListOf<HTMLElement> = parentEl.querySelectorAll(childrenSelectors) as NodeListOf<HTMLElement>;

			Velocity.animate(animatables, {
				top: -23,
				opacity: [0, "linear"]
			}, {
				complete: () => {
					resolve();
				},
				duration: this.animateOutDuration,
				easing: [1, 0, 1, 1]
			});
		});
	}

	protected intShouldAnimateIn(el: HTMLElement): boolean {
		let shouldAnimateIn: boolean = this.getAnimationState() === AnimationState.Out;
		// console.log("intShouldAnimateIn", AnimationState[this.getAnimationState()], shouldAnimateIn);
		return shouldAnimateIn;
	}

	protected intShouldAnimateOut(el: HTMLElement): boolean {
		let shouldAnimateOut: boolean = this.getAnimationState() === AnimationState.In;
		// console.log("intShouldAnimateOut", AnimationState[this.getAnimationState()], shouldAnimateOut);
		return shouldAnimateOut;
	}
}
