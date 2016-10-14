declare var Velocity: jquery.velocity.VelocityStatic;

import {SmartValue} from "../../communicator/smartValue";

import {AnimationState} from "./animationState";
import {TransitioningAnimationStrategy, TransitioningAnimationStrategyOptions} from "./transitioningAnimationStrategy";

export interface SlideContentInFromTopAnimationStrategyOptions extends TransitioningAnimationStrategyOptions {
	currentAnimationState: SmartValue<AnimationState>;
	contentToAnimate: ContentToAnimate[];
}

export interface ContentToAnimate {
	cssSelector: string;
	animateInOptions: AnimateInOptions;
}

export interface AnimateInOptions {
	slideDownDeltas: number[];
	delaysInMs: number[];
}

/**
 * Represents an animation where content fades in and slides downward into its position within the parent element provided.
 * When animating out, content will fade out and slide upwards.
 */
export class SlideContentInFromTopAnimationStrategy extends TransitioningAnimationStrategy<TransitioningAnimationStrategyOptions> {
	private animateInDuration: number;
	private animateOutDuration: number;
	private animateOutSlideUpDelta: number;
	private contentToAnimate: ContentToAnimate[];

	constructor(options?: SlideContentInFromTopAnimationStrategyOptions) {
		super(undefined /* animationDuration */, options, options.currentAnimationState);

		this.animateInDuration = 367;
		this.animateOutDuration = 267;
		this.animateOutSlideUpDelta = 23;
		this.contentToAnimate = options.contentToAnimate;
	}

	protected doAnimateIn(parentEl: HTMLElement): Promise<void>  {
		return new Promise<void>((resolve) => {
			for (let contentIndex = 0; contentIndex < this.contentToAnimate.length; contentIndex++) {
				let content = this.contentToAnimate[contentIndex];
				let animatables = parentEl.querySelectorAll(content.cssSelector) as NodeListOf<HTMLElement>;

				for (let animatableIndex = 0; animatableIndex < animatables.length; animatableIndex++) {
					let isLastElementToAnimate: boolean = (contentIndex === this.contentToAnimate.length - 1) && (animatableIndex === animatables.length - 1);

					this.animateElementIn(animatables[animatableIndex], content.animateInOptions.slideDownDeltas[animatableIndex], content.animateInOptions.delaysInMs[animatableIndex], isLastElementToAnimate)
						.then((lastElementFinishedAnimating) => {
							if (lastElementFinishedAnimating) {
								resolve();
							}
						});
				}
			}
		});
	}

	protected doAnimateOut(parentEl: HTMLElement): Promise<void> {
		return new Promise<void>((resolve) => {
			let childrenSelectors: string = this.contentToAnimate.map((content) => { return content.cssSelector; }).join(", ");
			let animatables: NodeListOf<HTMLElement> = parentEl.querySelectorAll(childrenSelectors) as NodeListOf<HTMLElement>;

			Velocity.animate(animatables, {
				top: -(this.animateOutSlideUpDelta),
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
		return this.getAnimationState() === AnimationState.Out;
	}

	protected intShouldAnimateOut(el: HTMLElement): boolean {
		return this.getAnimationState() === AnimationState.In;
	}

	/**
	 * Apply animate-in styling to a single element of content
	 */
	private animateElementIn(elem: HTMLElement, slideDownDelta: number, delayInMs: number, isLastElementToAnimate: boolean): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			elem.style.top = -(slideDownDelta) + "px";
			elem.style.opacity = "0";

			Velocity.animate(elem, {
				top: 0,
				opacity: [1, "linear"]
			}, {
					complete: () => {
						if (isLastElementToAnimate) {
							resolve(true);
						} else {
							resolve(false);
						}
					},
					delay: delayInMs,
					duration: this.animateInDuration,
					easing: [0, 0, 0, 1]
				});
		});
	}
}
