/// <reference path="../../../../typings/main/ambient/velocity-animate/velocity-animate.d.ts"/>
declare var Velocity: jquery.velocity.VelocityStatic;

export class AnimationHelper {
	public static stopAnimationsThen(el: HTMLElement, callback: () => void) {
		Velocity.animate(el, "stop", true);
		setTimeout(callback, 1);
	}
}
