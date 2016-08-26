/// <reference path="../../../../node_modules/onenotepicker/target/oneNotePicker.d.ts"/>

import {Constants} from "../../constants";
import {Utils} from "../../utils";
import {Settings} from "../../settings";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import {Clipper} from "../frontEndGlobals";
import {ClipperStateProp, ClipperStateHelperFunctions} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {OneNoteApiUtils} from "../oneNoteApiUtils";
import {Status} from "../status";

export interface SectionPickerState {
	notebooks?: OneNoteApi.Notebook[];
	status?: Status;
	apiResponseCode?: string;
	curSection?: {
		path: string;
		section: OneNoteApi.Section;
	};
};

interface SectionPickerProp extends ClipperStateProp {
	onPopupToggle: (shouldNowBeOpen: boolean) => void;
}

export class SectionPickerClass extends ComponentBase<SectionPickerState, SectionPickerProp> {
	static dataSource: OneNotePicker.OneNotePickerDataSource;

	getInitialState(): SectionPickerState {
		return {
			notebooks: undefined,
			status: Status.NotStarted,
			curSection: undefined
		};
	}

	onSectionClicked(curSection: any) {
		this.props.clipperState.setState({
			saveLocation: curSection.section.id
		});
		this.setState({
			curSection: curSection
		});
		Clipper.Storage.setValue(Constants.StorageKeys.currentSelectedSection, JSON.stringify(curSection));
		Clipper.logger.logClickEvent(Log.Click.Label.sectionComponent);
	}

	onPopupToggle(shouldNowBeOpen: boolean) {
		if (shouldNowBeOpen) {
			// If the user selects a section, onPopupToggle will fire because it closes the popup, even though it wasn't a click
			// so logging only when they open it is potentially the next best thing
			Clipper.logger.logClickEvent(Log.Click.Label.sectionPickerLocationContainer);
		}
		this.props.onPopupToggle(shouldNowBeOpen);
	}

	// Returns true if successful; false otherwise
	setDataSource(): boolean {
		if (!ClipperStateHelperFunctions.isUserLoggedIn(this.props.clipperState)) {
			return false;
		}

		let userToken = this.props.clipperState.userResult.data.user.accessToken;
		SectionPickerClass.dataSource = new OneNotePicker.OneNotePickerDataSource(userToken);
		return true;
	}

	// Begins by updating state with information found in local storage, then retrieves and stores fresh notebook information
	// from the API. If the user does not have a previous section selection in storage, or has not made a section selection yet,
	// additionally set the current section to the default section.
	retrieveAndUpdateNotebookAndSectionSelection(): Promise<SectionPickerState> {
		return new Promise<SectionPickerState>((resolve, reject) => {
			if (this.dataSourceUninitialized()) {
				this.setDataSource();
			}

			this.setState({
				status: Status.InProgress
			});

			// Always set the values with what is in local storage, and when the XHR returns it will overwrite if necessary
			this.fetchCachedNotebookAndSectionInfoAsState((cachedInfoAsState: SectionPickerState) => {
				if (cachedInfoAsState) {
					this.setState(cachedInfoAsState);
					this.props.clipperState.setState({
						saveLocation: cachedInfoAsState.curSection && cachedInfoAsState.curSection.section ? cachedInfoAsState.curSection.section.id : ""
					});
				}

				let getNotebooksEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetNotebooks);

				this.fetchFreshNotebooks(Clipper.getUserSessionId()).then((responsePackage) => {
					// The user may have signed out while waiting for the response. We don't want to populate notebooks in storage in this case.
					let userSignedOut = !ClipperStateHelperFunctions.isUserLoggedIn(this.props.clipperState);

					let correlationId = responsePackage.request.getResponseHeader(Constants.HeaderValues.correlationId);
					getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);

					let freshNotebooks = responsePackage.parsedResponse;
					if (!freshNotebooks) {
						getNotebooksEvent.setStatus(Log.Status.Failed);
						let error = { error: "GetNotebooks Promise was resolved but returned null or undefined value for notebooks." };
						getNotebooksEvent.setFailureInfo(error);
						this.setState({
							status: Status.Failed
						});
						reject(error);
						return;
					}

					getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.MaxDepth, OneNoteApi.NotebookUtils.getDepthOfNotebooks(freshNotebooks));

					if (!userSignedOut) {
						Clipper.Storage.setValue(Constants.StorageKeys.cachedNotebooks, JSON.stringify(freshNotebooks));
					}

					// The curSection property is the default section found in the notebook list
					let freshNotebooksAsState = SectionPickerClass.convertNotebookListToState(freshNotebooks);

					let shouldOverrideCurSectionWithDefault = true;
					if (this.state.curSection && this.state.curSection.section) {
						// The user has already selected a section ...
						let currentSectionStillExists = OneNoteApi.NotebookUtils.sectionExistsInNotebooks(freshNotebooks, this.state.curSection.section.id);
						if (currentSectionStillExists) {
							// ... which exists, so we don't override it with the default
							freshNotebooksAsState.curSection = this.state.curSection;
							shouldOverrideCurSectionWithDefault = false;
						}
						getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.CurrentSectionStillExists, currentSectionStillExists);
					}

					if (shouldOverrideCurSectionWithDefault) {
						// A default section was found, so we set it as currently selected since the user has not made a valid selection yet
						if (!userSignedOut) {
							// curSection can be undefined if there's no default found, which is fine
							Clipper.Storage.setValue(Constants.StorageKeys.currentSelectedSection, JSON.stringify(freshNotebooksAsState.curSection));
						}
						this.props.clipperState.setState({ saveLocation: freshNotebooksAsState.curSection ? freshNotebooksAsState.curSection.section.id : undefined });
					}

					this.setState(freshNotebooksAsState);
					resolve(freshNotebooksAsState);
				}, (failure: OneNoteApi.RequestError) => {
					this.setState({
						apiResponseCode: OneNoteApiUtils.getApiResponseCode(failure)
					});

					if (this.state.notebooks) {
						failure.error += ". Falling back to storage.";
					} else {
						this.setState({
							status: Status.Failed
						});
					}
					OneNoteApiUtils.logOneNoteApiRequestError(getNotebooksEvent, failure);
					reject(failure);
				}).then(() => {
					Clipper.logger.logEvent(getNotebooksEvent);
				});
			});
		});
	}

	dataSourceUninitialized(): boolean {
		return !SectionPickerClass.dataSource ||
			!SectionPickerClass.dataSource.authToken ||
			!ClipperStateHelperFunctions.isUserLoggedIn(this.props.clipperState) ||
			(SectionPickerClass.dataSource.authToken !== this.props.clipperState.userResult.data.user.accessToken);
	}

	// Retrieves the cached notebook list and last selected section from local storage in state form
	fetchCachedNotebookAndSectionInfoAsState(callback: (state: SectionPickerState) => void): void {
		Clipper.Storage.getValue(Constants.StorageKeys.cachedNotebooks, (notebooks) => {
			Clipper.Storage.getValue(Constants.StorageKeys.currentSelectedSection, (curSection) => {
				if (notebooks) {
					let parsedNotebooks: any;
					try {
						parsedNotebooks = JSON.parse(notebooks);
					} catch (e) {
						Clipper.logger.logJsonParseUnexpected(notebooks);
					}

					// It is ok for parsed value to be set to undefined, as this corresponds to the default section
					let parsedCurSection: any;
					if (parsedNotebooks && curSection) {
						try {
							parsedCurSection = JSON.parse(curSection);
						} catch (e) {
							Clipper.logger.logJsonParseUnexpected(curSection);
						}
					}

					callback({
						notebooks: parsedNotebooks,
						status: Status.Succeeded,
						curSection: parsedCurSection
					});
				} else {
					// Cached information not found in storage
					callback(undefined);
				}
			});
		});
	}

	// Fetches the user's notebooks from OneNote API, returning both the notebook list and the XHR
	fetchFreshNotebooks(sessionId: string): Promise<OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>> {
		if (this.dataSourceUninitialized()) {
			this.setDataSource();
		}

		return new Promise<OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>>((resolve, reject) => {
			let headers: { [key: string]: string } = {};
			headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
			headers[Constants.HeaderValues.userSessionIdKey] = sessionId;

			SectionPickerClass.dataSource.getNotebooks(headers).then((responsePackage: OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>) => {
				resolve(responsePackage);
			}, (failure: OneNoteApi.RequestError) => {
				reject(failure);
			});
		});
	}

	// Given a notebook list, converts it to state form where the curSection is the default section (or undefined if not found)
	static convertNotebookListToState(notebooks: OneNoteApi.Notebook[]): SectionPickerState {
		let pathToDefaultSection = OneNoteApi.NotebookUtils.getPathFromNotebooksToSection(notebooks, s => s.isDefault);
		let defaultSectionInfo = SectionPickerClass.formatSectionInfoForStorage(pathToDefaultSection);

		return {
			notebooks: notebooks,
			status: Status.Succeeded,
			curSection: defaultSectionInfo
		};
	}

	static formatSectionInfoForStorage(pathToSection: OneNoteApi.SectionPathElement[]): { path: string, section: OneNoteApi.Section } {
		if (!pathToSection || pathToSection.length === 0) {
			return undefined;
		}
		return {
			path: pathToSection.map(elem => elem.name).join(" > "),
			section: pathToSection[pathToSection.length - 1] as OneNoteApi.Section
		};
	}

	render() {
		if (this.dataSourceUninitialized()) {
			// This logic gets executed on app launch (if already signed in) and whenever the user signs in or out ...
			let dataSourceSet = this.setDataSource();
			if (dataSourceSet) {
				// ... so we want to ensure we only fetch fresh notebooks on the sign in
				this.retrieveAndUpdateNotebookAndSectionSelection();
			}
		} else if (!this.state.notebooks && this.state.status === Status.NotStarted) {
			// Since we re-render this with initial state when we switch between modes that do or do not render this component, we don't want to lose our
			// stored notebooks in state
			this.fetchCachedNotebookAndSectionInfoAsState((cachedInfoAsState: SectionPickerState) => {
				if (cachedInfoAsState) {
					this.setState(cachedInfoAsState);
					this.props.clipperState.setState({
						saveLocation: cachedInfoAsState.curSection && cachedInfoAsState.curSection.section ? cachedInfoAsState.curSection.section.id : ""
					});
				}
			});
		}

		let localizedStrings = {
			defaultLocation: Localization.getLocalizedString("WebClipper.SectionPicker.DefaultLocation"),
			loadingNotebooks: Localization.getLocalizedString("WebClipper.SectionPicker.LoadingNotebooks"),
			noNotebooksFound: Localization.getLocalizedString("WebClipper.SectionPicker.NoNotebooksFound"),
			notebookLoadFailureMessage: Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadFailureMessage")
		};

		// Compute all the necessary properties for the Picker based on the state we are in
		let curSectionId: string, textToDisplay: string = localizedStrings.defaultLocation;

		// We could have returned correctly, but there is no default Notebook
		if (this.state.status === Status.Succeeded) {
			if (this.state.curSection) {
				curSectionId = this.state.curSection.section.id;
				textToDisplay = this.state.curSection.path;
			}
		}

		// Display an un-retryable message if API responds with a code that is not retryable
		// Note that if this is an unhandled api response code, we assume it is not retryable
		if (this.state.apiResponseCode && !OneNoteApiUtils.isRetryable(this.state.apiResponseCode)) {
			localizedStrings.notebookLoadFailureMessage = Localization.getLocalizedString("WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage");
		}

		return (
			<div id={Constants.Ids.locationPickerContainer}>
				<div className="optionLabel">
					<label className="buttonLabelFont" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
						{Localization.getLocalizedString("WebClipper.Label.ClipLocation")}
					</label>
				</div>
				<OneNotePicker.OneNotePickerComponent
					notebooks={this.state.notebooks}
					status={Status[this.state.status]}
					onPopupToggle={this.onPopupToggle.bind(this)}
					onSectionClicked={this.onSectionClicked.bind(this)}
					textToDisplay={textToDisplay}
					curSectionId={curSectionId}
					localizedStrings={localizedStrings} />
			</div>
		);
	}
}

let component = SectionPickerClass.componentize();
export {component as SectionPicker};
