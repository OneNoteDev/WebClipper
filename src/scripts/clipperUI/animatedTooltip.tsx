import {Constants} from "../constants";

import {ComponentBase} from "./componentBase";
import {Tooltip, TooltipProps} from "./tooltip";

import {AnimationState} from "./animations/animationState";
import {AnimationStrategy} from "./animations/animationStrategy";
import {ExpandFromRightAnimationStrategy} from "./animations/expandFromRightAnimationStrategy";
import {SlidingHeightAnimationStrategy, NewHeightInfo} from "./animations/slidingHeightAnimationStrategy";

export interface AnimatedTooltipState {
	uiExpanded: boolean;
}

export interface AnimatedTooltipProps extends TooltipProps {
	onAfterCollapse?: (tooltipElement: HTMLElement) => void;
	onHeightChange?: (newHeightInfo: NewHeightInfo) => void;
}

export class AnimatedTooltipClass extends ComponentBase<AnimatedTooltipState, AnimatedTooltipProps> {
	private tooltipAnimationStrategy: AnimationStrategy;
	private heightAnimationStrategy: AnimationStrategy;

	constructor(props: AnimatedTooltipProps) {
		super(props);
		this.tooltipAnimationStrategy = new ExpandFromRightAnimationStrategy({
			extShouldAnimateIn: () => { return this.state.uiExpanded; },
			extShouldAnimateOut: () => { return !this.state.uiExpanded; },
			onAfterAnimateOut: this.props.onAfterCollapse
		});
		this.heightAnimationStrategy = new SlidingHeightAnimationStrategy(this.props.elementId, {
			onAfterHeightAnimatorDraw: this.props.onHeightChange
		});
	}

	getInitialState(): AnimatedTooltipState {
		return {
			uiExpanded: true
		};
	}

	closeTooltip() {
		this.setState({ uiExpanded: false });
		if (this.props.onCloseButtonHandler) {
			this.props.onCloseButtonHandler();
		}
	}

	onHeightAnimatorDraw(heightAnimator: HTMLElement) {
		this.heightAnimationStrategy.animate(heightAnimator);
	}

	onTooltipDraw(tooltipElement: HTMLElement) {
		this.tooltipAnimationStrategy.animate(tooltipElement);
	}

	render() {
		// We have to make the renderablePanel undefined on the collapse for the vertical shrink animation to function correctly
		let renderablePanel = (
			<div className={Constants.Classes.heightAnimator} {...this.onElementDraw(this.onHeightAnimatorDraw) }>
				{this.state.uiExpanded ? this.props.renderablePanel : undefined}
			</div>
		);
		return (
			<Tooltip
				brandingImage={this.props.brandingImage}
				elementId={this.props.elementId}
				title={this.props.title}
				onCloseButtonHandler={this.closeTooltip.bind(this)}
				onElementDraw={this.onTooltipDraw.bind(this)}
				renderablePanel={renderablePanel}
				contentClasses={this.props.contentClasses}/>
		);
	}
}

let component = AnimatedTooltipClass.componentize();
export {component as AnimatedTooltip};
