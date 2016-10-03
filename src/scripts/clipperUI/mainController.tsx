/// <reference path="../../../typings/main/ambient/velocity-animate/velocity-animate.d.ts"/>
declare var Velocity: jquery.velocity.VelocityStatic;

import {Constants} from "../constants";
import {Utils} from "../utils";

import {SmartValue} from "../communicator/smartValue";

import {Localization} from "../localization/localization";

import * as Log from "../logging/log";

import {ClipMode} from "./clipMode";
import {Clipper} from "./frontEndGlobals";
import {ClipperStateProp, ClipperStateHelperFunctions} from "./clipperState";
import {ComponentBase} from "./componentBase";
import {OneNoteApiUtils} from "./oneNoteApiUtils";
import {Status} from "./status";

import {AnimationHelper} from "./animations/animationHelper";
import {AnimationState} from "./animations/animationState";
import {AnimationStrategy} from "./animations/animationStrategy";
import {ExpandFromRightAnimationStrategy} from "./animations/expandFromRightAnimationStrategy";
import {SlideFromRightAnimationStrategy} from "./animations/slideFromRightAnimationStrategy";
import {SlidingHeightAnimationStrategy} from "./animations/slidingHeightAnimationStrategy";

import {CloseButton} from "./components/closeButton";
import {Footer} from "./components/footer";

import {ClippingPanel} from "./panels/clippingPanel";
import {DialogButton, DialogPanel} from "./panels/dialogPanel";
import {ErrorDialogPanel} from "./panels/errorDialogPanel";
import {LoadingPanel} from "./panels/loadingPanel";
import {OptionsPanel} from "./panels/optionsPanel";
import {RatingsPanel} from "./panels/ratingsPanel";
import {RegionSelectingPanel} from "./panels/regionSelectingPanel";
import {SignInPanel} from "./panels/signInPanel";
import {SuccessPanel} from "./panels/successPanel";

export enum CloseReason {
	CloseButton,
	EscPress
}

export enum PanelType {
	None,
	BadState,
	Loading,
	SignInNeeded,
	ClipOptions,
	RegionInstructions,
	ClippingToApi,
	ClippingFailure,
	ClippingSuccess
}

export interface MainControllerState {
	currentPanel?: PanelType;
	ratingsPanelAnimationState?: SmartValue<AnimationState>; // stored for when the ratings subpanel re-renders while the MainController does not
}

export interface MainControllerProps extends ClipperStateProp {
	onSignInInvoked: () => void;
	onSignOutInvoked: () => void;
	updateFrameHeight: (newContainerHeight: number) => void;
	onStartClip: () => void;
}

export class MainControllerClass extends ComponentBase<MainControllerState, MainControllerProps> {
	private popupIsOpen: boolean;

	private controllerAnimationStrategy: AnimationStrategy;
	private panelAnimationStrategy: AnimationStrategy;
	private heightAnimationStrategy: AnimationStrategy;

	constructor(props: MainControllerProps) {
		super(props);

		this.initAnimationStrategy();

		// The user could have pressed esc when Clipper iframe was not in focus
		Clipper.getInjectCommunicator().registerFunction(Constants.FunctionKeys.escHandler, () => {
			this.handleEscPress();
		});

		document.onkeydown = (event) => {
			if (event.keyCode === Constants.KeyCodes.esc) {
				this.handleEscPress();
			}
		};
	}

	getInitialState(): MainControllerState {
		return {
			currentPanel: PanelType.None
		};
	}

	handleEscPress() {
		if (this.isCloseable()) {
			this.closeClipper(CloseReason.EscPress);
		}
	}

	initAnimationStrategy() {
		this.controllerAnimationStrategy = new ExpandFromRightAnimationStrategy({
			extShouldAnimateIn: () => { return this.props.clipperState.uiExpanded; },
			extShouldAnimateOut: () => { return !this.props.clipperState.uiExpanded; },
			onBeforeAnimateOut: () => { this.setState({ currentPanel: PanelType.None }); },
			onBeforeAnimateIn: () => { this.props.clipperState.reset(); },
			onAnimateInExpand: () => { this.setState({ currentPanel: this.getPanelTypeToShow() }); },
			onAfterAnimateOut: () => { Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.hideUi); }
		});

		this.panelAnimationStrategy = new SlideFromRightAnimationStrategy({
			extShouldAnimateIn: () => { return this.state.currentPanel !== PanelType.None; },
			extShouldAnimateOut: () => { return this.getPanelTypeToShow() !== this.state.currentPanel; },
			onAfterAnimateOut: () => { this.setState({ currentPanel: this.getPanelTypeToShow() }); },
			onAfterAnimateIn: () => { this.setState({ currentPanel: this.getPanelTypeToShow() }); }
		});

		this.heightAnimationStrategy = new SlidingHeightAnimationStrategy(Constants.Ids.mainController, {
			onAfterHeightAnimatorDraw: (newHeightInfo) => {
				if (this.popupIsOpen) {
					// Sometimes during the delay, we open the popup, so the frame height update needs to account for that too
					this.updateFrameHeightAfterPopupToggle(this.popupIsOpen);
				} else {
					this.props.updateFrameHeight(newHeightInfo.newContainerHeight);
				}
			}
		});
	}

	isCloseable() {
		let panelType = this.state.currentPanel;
		return panelType !== PanelType.None && panelType !== PanelType.ClippingToApi;
	}

	onPopupToggle(shouldNowBeOpen: boolean) {
		this.popupIsOpen = shouldNowBeOpen;
		this.updateFrameHeightAfterPopupToggle(shouldNowBeOpen);
	}

	private updateFrameHeightAfterPopupToggle(shouldNowBeOpen: boolean) {
		let saveToLocationContainer = document.getElementById(Constants.Ids.saveToLocationContainer);
		if (saveToLocationContainer) {
			let currentLocationContainerPosition: ClientRect = saveToLocationContainer.getBoundingClientRect();
			let aboutToOpenHeight = Constants.Styles.sectionPickerContainerHeight + currentLocationContainerPosition.top + currentLocationContainerPosition.height;
			let aboutToCloseHeight = document.getElementById(Constants.Ids.mainController).offsetHeight;
			let newHeight = shouldNowBeOpen ? aboutToOpenHeight : aboutToCloseHeight;
			this.props.updateFrameHeight(newHeight);
		}
	}

	getPanelTypeToShow(): PanelType {
		if (this.props.clipperState.badState) {
			return PanelType.BadState;
		}

		if (!this.props.clipperState.uiExpanded) {
			return PanelType.None;
		}

		if ((this.props.clipperState.userResult && this.props.clipperState.userResult.status === Status.InProgress) ||
			this.props.clipperState.fetchLocStringStatus === Status.InProgress || !this.props.clipperState.invokeOptions) {
			return PanelType.Loading;
		}

		if (!ClipperStateHelperFunctions.isUserLoggedIn(this.props.clipperState)) {
			return PanelType.SignInNeeded;
		}

		if (this.props.clipperState.currentMode.get() === ClipMode.Region && this.props.clipperState.regionResult.status !== Status.Succeeded) {
			switch (this.props.clipperState.regionResult.status) {
				case Status.InProgress:
					return PanelType.Loading;
				default:
					return PanelType.RegionInstructions;
			}
		}

		switch (this.props.clipperState.oneNoteApiResult.status) {
			default:
			case Status.NotStarted:
				return PanelType.ClipOptions;
			case Status.InProgress:
				return PanelType.ClippingToApi;
			case Status.Failed:
				return PanelType.ClippingFailure;
			case Status.Succeeded:
				return PanelType.ClippingSuccess;
		}
	}

	closeClipper(closeReason?: CloseReason) {
		let closeEvent = new Log.Event.BaseEvent(Log.Event.Label.CloseClipper);
		closeEvent.setCustomProperty(Log.PropertyName.Custom.CurrentPanel, PanelType[this.state.currentPanel]);
		closeEvent.setCustomProperty(Log.PropertyName.Custom.CloseReason, CloseReason[closeReason]);
		Clipper.logger.logEvent(closeEvent);

		// Clear region selections on clipper exit rather than invoke to avoid conflicting logic with scenarios like context menu image selection
		this.props.clipperState.setState({
			uiExpanded: false,
			regionResult: { status: Status.NotStarted, data: [] }
		});
	}

	onMainControllerDraw(mainControllerElement: HTMLElement) {
		this.controllerAnimationStrategy.animate(mainControllerElement);
	}

	onPanelAnimatorDraw(panelAnimator: HTMLElement) {
		let panelTypeToShow: PanelType = this.getPanelTypeToShow();
		let panelIsCorrect = panelTypeToShow === this.state.currentPanel;

		if (panelTypeToShow === PanelType.ClipOptions && this.state.currentPanel !== PanelType.ClipOptions) {
			this.popupIsOpen = false;
		}

		this.panelAnimationStrategy.animate(panelAnimator);

		if (!panelIsCorrect && this.panelAnimationStrategy.getAnimationState() === AnimationState.GoingIn) {
			// We'll speed things up by stopping the current one, and trigger the next one
			AnimationHelper.stopAnimationsThen(panelAnimator, () => {
				this.panelAnimationStrategy.setAnimationState(AnimationState.In);
				this.setState({ });
			});
		}
	}

	onHeightAnimatorDraw(heightAnimator: HTMLElement) {
		this.heightAnimationStrategy.animate(heightAnimator);
	}

	getCurrentPanel() {
		let panelType = this.state.currentPanel;
		let buttons: DialogButton[] = [];
		switch (panelType) {
			case PanelType.BadState:
				buttons.push({
					id: Constants.Ids.refreshPageButton,
					label: Localization.getLocalizedString("WebClipper.Action.RefreshPage"),
					handler: () => {
						Clipper.getInjectCommunicator().callRemoteFunction(Constants.FunctionKeys.refreshPage);
					}
				});
				return <ErrorDialogPanel message={Localization.getLocalizedString("WebClipper.Error.OrphanedWebClipperDetected") } buttons={buttons} />;
			case PanelType.Loading:
				return <LoadingPanel clipperState={this.props.clipperState} />;
			case PanelType.SignInNeeded:
				return <SignInPanel clipperState={this.props.clipperState}
					onSignInInvoked={this.props.onSignInInvoked}/>;
			case PanelType.ClipOptions:
				return <OptionsPanel onPopupToggle={this.onPopupToggle.bind(this) }
					clipperState={this.props.clipperState}
					onStartClip={this.props.onStartClip} />;
			case PanelType.RegionInstructions:
				return <RegionSelectingPanel clipperState={this.props.clipperState} />;
			case PanelType.ClippingToApi:
				return <ClippingPanel clipperState={this.props.clipperState} />;
			case PanelType.ClippingFailure:
				let error = this.props.clipperState.oneNoteApiResult.data as OneNoteApi.RequestError;
				let apiResponseCode: string = OneNoteApiUtils.getApiResponseCode(error);

				if (OneNoteApiUtils.isRetryable(apiResponseCode)) {
					buttons.push({
						id: Constants.Ids.dialogTryAgainButton,
						label: Localization.getLocalizedString("WebClipper.Action.TryAgain"),
						handler: this.props.onStartClip
					});
				}
				buttons.push({
					id: Constants.Ids.dialogBackButton,
					label: Localization.getLocalizedString("WebClipper.Action.BackToHome"),
					handler: () => {
						this.props.clipperState.setState({
							oneNoteApiResult: {
								data: this.props.clipperState.oneNoteApiResult.data,
								status: Status.NotStarted
							}
						});
					}
				});

				return <ErrorDialogPanel message={OneNoteApiUtils.getLocalizedErrorMessage(apiResponseCode) }
					buttons={buttons} />;
			case PanelType.ClippingSuccess:
				let panels: any[] = [<SuccessPanel clipperState={this.props.clipperState} />];

				if (!this.state.ratingsPanelAnimationState) {
					this.state.ratingsPanelAnimationState = new SmartValue<AnimationState>(AnimationState.Out);
				}

				if (this.props.clipperState.showRatingsPrompt && this.props.clipperState.showRatingsPrompt.get()) {
					panels.push(<RatingsPanel clipperState={this.props.clipperState} ratingsAnimationState={this.state.ratingsPanelAnimationState} />);
				}

				return panels;
			default:
				return undefined;
		}
	}

	getCloseButtonForType() {
		if (this.isCloseable()) {
			return (
				<CloseButton onClickHandler={this.closeClipper.bind(this)} onClickHandlerParams={[CloseReason.CloseButton]} />
			);
		} else {
			return undefined;
		}
	}

	getCurrentFooter(): any {
		let panelType = this.state.currentPanel;
		switch (panelType) {
			case PanelType.ClipOptions:
			case PanelType.ClippingFailure:
			case PanelType.SignInNeeded:
				return <Footer clipperState={this.props.clipperState} onSignOutInvoked={this.props.onSignOutInvoked} />;
			case PanelType.ClippingSuccess:
				/* falls through */
			default:
				return undefined;
		}
	}

	render() {
		let panelToRender = this.getCurrentPanel();
		let closeButtonToRender = this.getCloseButtonForType();
		let footerToRender = this.getCurrentFooter();

		return (
			<div id={Constants.Ids.mainController} {...this.onElementDraw(this.onMainControllerDraw) }>
				{closeButtonToRender}
				<div className="panelContent">
					<div className={Constants.Classes.heightAnimator} {...this.onElementDraw(this.onHeightAnimatorDraw)}>
						<div className={Constants.Classes.panelAnimator} {...this.onElementDraw(this.onPanelAnimatorDraw)}>
							{panelToRender}
							{footerToRender}
						</div>
					</div>
				</div>
			</div>
		);
	}
}

let component = MainControllerClass.componentize();
export {component as MainController};
