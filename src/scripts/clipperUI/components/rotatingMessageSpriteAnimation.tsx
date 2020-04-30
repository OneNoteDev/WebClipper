import {Constants} from "../../constants";

import {Localization} from "../../localization/localization";

import {ComponentBase} from "../componentBase";

import {SpriteAnimation, SpriteAnimationProps} from "./spriteAnimation";

interface RotatingMessageSpriteAnimationProps extends SpriteAnimationProps {
	messageToDisplay?: string;
	shouldDisplayMessage?: boolean;
}

interface SpriteAnimationState {
	inProgress: boolean;
}

class RotatingMessageSpriteAnimationClass extends ComponentBase<SpriteAnimationState, RotatingMessageSpriteAnimationProps> {
	render() {
		const shouldDisplayMessage = "shouldDisplayMessage" in this.props ? this.props.shouldDisplayMessage : true;
		const message = shouldDisplayMessage ? (this.props.messageToDisplay ? this.props.messageToDisplay : Localization.getLocalizedString("WebClipper.Preview.Spinner.ClipAnyTimeInFullPage")) : undefined;

		return (
			<div>
				<SpriteAnimation
					spriteUrl={this.props.spriteUrl}
					imageHeight={this.props.imageHeight}
					imageWidth={this.props.imageWidth}
					totalFrameCount={this.props.totalFrameCount}
					loop={this.props.loop}
					ariaLabel={message}
					/>
				{shouldDisplayMessage ?
					<div
						id={Constants.Ids.spinnerText}
						className="spinnerText"
						style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semilight)}>
						<span aria-hidden="true">{message}</span>
					</div>
					: ""}
			</div>
		);
	}
}

let component = RotatingMessageSpriteAnimationClass.componentize();
export {component as RotatingMessageSpriteAnimation};
