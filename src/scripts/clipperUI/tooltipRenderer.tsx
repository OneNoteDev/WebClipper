import {Constants} from "../constants";

import {ExtensionUtils} from "../extensions/extensionUtils";
import {InvokeSource} from "../extensions/invokeSource";

import {Localization} from "../localization/localization";

import {Clipper} from "./frontEndGlobals";
import {ComponentBase} from "./componentBase";
import {AnimatedTooltip} from "./animatedTooltip";
import {TooltipProps} from "./tooltipProps";
import {TooltipType, TooltipTypeUtils} from "./tooltipType";

import {NewHeightInfo} from "./animations/slidingHeightAnimationStrategy";

import {ChangeLogPanel} from "./panels/changeLogPanel";
import {DialogButton, DialogPanel} from "./panels/dialogPanel";

export interface TooltipRendererState {
	tooltipToRenderOverride?: TooltipType;
}

export interface TooltipRendererProps {
	onCloseButtonHandler?: () => void;
	onHeightChange?: (newHeightInfo: NewHeightInfo) => void;
	onTooltipClose?: () => void;
	tooltipToRender?: TooltipType;
	tooltipProps?: any;
}

class TooltipRendererClass extends ComponentBase<TooltipRendererState, TooltipRendererProps> {
	getInitialState(): TooltipRendererState {
		return {};
	}

	getChangeLogPanel() {
		let whatsNewProps = this.props.tooltipProps as TooltipProps.WhatsNew;
		let handleProceedToWebClipperButton = () => {
			Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.invokeClipperFromPageNav, {
				param: InvokeSource.WhatsNewTooltip
			});
		};

		return (
			<div>
				<ChangeLogPanel updates={whatsNewProps.updates} />
				<div className="wideButtonContainer changelog-button">
					<a id={Constants.Ids.proceedToWebClipperButton} {...this.enableInvoke({callback: handleProceedToWebClipperButton, tabIndex: 10})}>
						<span className="wideButtonFont wideActionButton"
							style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold) }>
							{Localization.getLocalizedString("WebClipper.Label.ProceedToWebClipperFun") }
						</span>
					</a>
				</div>
			</div>
		);
	}

	getContentClasses(): {} {
		let currentPanel = this.getCurrentPanelType();
		let classes: string[] = [];
		switch (currentPanel) {
			case TooltipType.Pdf:
				/* falls through */
			case TooltipType.Product:
				/* falls through */
			case TooltipType.Recipe:
				/* falls through */
			case TooltipType.Video:
				classes.push("tooltip-upsell");
				return classes;
			case TooltipType.ChangeLog:
				classes.push("changelog-content");
				return classes;
			default:
				return classes;
		}
	}

	getCurrentPanelType(): TooltipType {
		return this.state.hasOwnProperty("tooltipToRenderOverride") ? this.state.tooltipToRenderOverride : this.props.tooltipToRender;
	}

	getCurrentTitle(): string {
		let currentPanel = this.getCurrentPanelType();
		switch (currentPanel) {
			case TooltipType.ChangeLog:
				return Localization.getLocalizedString("WebClipper.Label.WhatsNew");
			default:
				return "";
		}
	}

	getTooltipPanel(tooltipType: TooltipType) {
		let handleProceedToWebClipperButton = () => {
			Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.invokeClipperFromPageNav, {
				param: TooltipTypeUtils.toInvokeSource(tooltipType)
			});
		};

		let tooltipAsString = TooltipType[tooltipType];
		let tooltipImagePath = "tooltips/" + tooltipAsString + ".png";
		tooltipImagePath = tooltipImagePath.toLowerCase();

		let content: HTMLElement[] = [(<img className="tooltip-image" src={ExtensionUtils.getImageResourceUrl(tooltipImagePath)}/>)];

		let buttons: DialogButton[] = [{
			id: Constants.Ids.proceedToWebClipperButton,
			label: Localization.getLocalizedString("WebClipper.Label.ProceedToWebClipperFun"),
			handler: handleProceedToWebClipperButton
		}];

		let message = "WebClipper.Label." + tooltipAsString + "Tooltip";
		return <DialogPanel
			message={Localization.getLocalizedString(message)}
			content={content}
			buttons={buttons}
			fontFamily={Localization.FontFamily.Semilight}/>;
	}

	getWhatsNewPanel() {
		let onShowChangeLogButton = () => {
			this.setState({ tooltipToRenderOverride: TooltipType.ChangeLog });
		};
		let buttons: DialogButton[] = [{
			id: Constants.Ids.checkOutWhatsNewButton,
			label: Localization.getLocalizedString("WebClipper.Label.OpenChangeLogFromTooltip"),
			handler: onShowChangeLogButton.bind(this)
		}];
		return <DialogPanel message={Localization.getLocalizedString("WebClipper.Label.WebClipperWasUpdatedFun") } buttons={buttons}/>;
	}

	createTooltipPanelToShow(): any {
		let currentPanel = this.getCurrentPanelType();

		if (currentPanel === undefined) {
			return undefined;
		}

		switch (currentPanel) {
			case TooltipType.WhatsNew:
				return this.getWhatsNewPanel();
			case TooltipType.ChangeLog:
				return this.getChangeLogPanel();
			default:
				return this.getTooltipPanel(currentPanel);
		}
	}

	getBrandingImage(): any {
		let currentPanel = this.getCurrentPanelType();
		switch (currentPanel) {
			case TooltipType.ChangeLog:
				return undefined;
			default:
				return (
					<div id={Constants.Ids.brandingContainer}>
						<p className="tooltip-corner-branding">
							<img src={ExtensionUtils.getImageResourceUrl("tooltips/onenote_tooltip_branding.png") } />
						</p>
					</div>
				);
		}
	}

	render() {
		return (
			<AnimatedTooltip
				brandingImage={this.getBrandingImage()}
				elementId={Constants.Ids.pageNavAnimatedTooltip}
				title={this.getCurrentTitle()}
				onAfterCollapse={this.props.onTooltipClose}
				onCloseButtonHandler={this.props.onCloseButtonHandler}
				onHeightChange={this.props.onHeightChange}
				renderablePanel={this.createTooltipPanelToShow() }
				contentClasses={this.getContentClasses()}/>
		);
	}
}

let component = TooltipRendererClass.componentize();
export {component as TooltipRenderer}
