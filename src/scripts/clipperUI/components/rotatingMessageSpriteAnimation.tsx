import {Constants} from "../../constants";

import {Localization} from "../../localization/localization";

import {ComponentBase} from "../componentBase";

import {SpriteAnimation, SpriteAnimationProps} from "./spriteAnimation";

interface RotatingMessageSpriteAnimationProps extends SpriteAnimationProps {
	messages: string[];
}

interface SpriteAnimationState {
	inProgress: boolean;
}

class RotatingMessageSpriteAnimationClass extends ComponentBase<SpriteAnimationState, RotatingMessageSpriteAnimationProps> {
	render() {
		return (
			<div>
				<SpriteAnimation
					spriteUrl={this.props.spriteUrl}
					imageHeight={this.props.imageHeight}
					imageWidth={this.props.imageWidth}
					totalFrameCount={this.props.totalFrameCount}
					loop={this.props.loop}
					/>
				<div
					id={Constants.Ids.spinnerText}
					class="spinnerText"
					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semilight)}>
					{Localization.getLocalizedString("WebClipper.Preview.Spinner.ClipAnyTimeInFullPage")}
				</div>
			</div>
		);
	}
}

let component = RotatingMessageSpriteAnimationClass.componentize();
export {component as RotatingMessageSpriteAnimation};
