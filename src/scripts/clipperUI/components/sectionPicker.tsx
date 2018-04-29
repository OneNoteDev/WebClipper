import {Constants} from "../../constants";
import {Settings} from "../../settings";

import {Localization} from "../../localization/localization";

import * as Log from "../../logging/log";

import { ClipperStorageKeys } from "../../storage/clipperStorageKeys";

import { OneNotePicker, Notebook, Section, GlobalProps, NotebookListUpdater, OneNoteDataProvider, OneNotePickerCallbacks } from "../../../../node_modules/onenotepicker/dist/OneNotePicker";
import { OneNoteApiDataProvider, SectionGroup } from "../../../../node_modules/onenotepicker/dist/OneNoteApiDataProvider";
import { OneNoteItemUtils } from "../../../../node_modules/onenotepicker/dist/OneNoteItemUtils";

import {Clipper} from "../frontEndGlobals";
import {ClipperStateProp} from "../clipperState";
import {ClipperStateUtilities} from "../clipperStateUtilities";
import {ComponentBase} from "../componentBase";
import {OneNoteApiUtils} from "../oneNoteApiUtils";
import {Status} from "../status";

export type notebookOrSectionGroup = Notebook | SectionGroup;
export type SectionPathElement = notebookOrSectionGroup | Section;

export interface SectionPickerState {
	notebooks?: Notebook[];
	status?: Status;
	apiResponseCode?: string;
	curSection?: {
		path: string;
		currentItemId: string;
	};
	authToken?: string;
	globals?: {
		focusOnMount: boolean;
		oneNoteDataProvider: OneNoteDataProvider | undefined;
		notebookListUpdater: NotebookListUpdater | undefined; 
		callbacks: OneNotePickerCallbacks;
		strings?: {};
		selectedID?: string;
		ariaSelectedID?: string;
		notebookExpandDepth?: number;
	}
};

interface SectionPickerProp extends ClipperStateProp {
	onPopupToggle: (shouldNowBeOpen: boolean) => void;
}

export class SectionPickerClass extends ComponentBase<SectionPickerState, SectionPickerProp> {

	static dataSource: OneNoteDataProvider;

	getInitialState(): SectionPickerState {
		return {
			notebooks: undefined,
			status: Status.NotStarted,
			curSection: undefined,
			authToken: undefined,
			globals: {
				focusOnMount: true,
				oneNoteDataProvider: undefined,
				notebookListUpdater: undefined,
				callbacks: {
					onNotebookHierarchyUpdated: (newNotebookHierarchy) => {
					},
					onSectionSelected: (section, breadcrumbs) => {
						this.state.globals.selectedID = this.state.curSection.currentItemId;

						const sectionPath = breadcrumbs.map(x => x.name).join('>');
						console.log(sectionPath);
					},
					onPageSelected: (page, breadcrumbs) => {
						this.state.globals.selectedID = page.id;

						const pagePath = breadcrumbs.map(x => x.name).join(' > ');
						console.log(pagePath);

					},
					onAccessibleSelection: (selectedItemId: string) => {
						this.state.globals.ariaSelectedID = selectedItemId;
					},
					onNotebookCreated: (notebook: Notebook) => {
						this.state.globals.callbacks.onNotebookCreated = undefined;

						if (this.state.globals.notebookListUpdater) {
							this.state.globals.notebookListUpdater.addNotebook(notebook);
							this.state.globals.selectedID = notebook.id;
						}

						console.log(`Notebook created: ${notebook.name}`);
					},
					onSectionCreated: (section: Section) => {
						console.log(`Section created: ${section.name}`);

						if (this.state.globals.notebookListUpdater) {
							this.state.globals.notebookListUpdater!.addSection(section);
							this.state.globals.selectedID = section.id;
						}
					}
				}
			}
		};
	}

	onSectionClicked(curSection: any) {
		this.props.clipperState.setState({
			saveLocation: curSection.currentItemId
		});
		this.setState({
			curSection: curSection
		});
		Clipper.storeValue(ClipperStorageKeys.currentSelectedSection, JSON.stringify(curSection));
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
		if (!ClipperStateUtilities.isUserLoggedIn(this.props.clipperState)) {
			return false;
		}

		let userToken = this.props.clipperState.userResult.data.user.accessToken;
		SectionPickerClass.dataSource = new OneNoteApiDataProvider(userToken);
		return true;
	}

	setAuthToken() {
		let userToken = this.props.clipperState.userResult.data.user.accessToken;
		if (!!SectionPickerClass.dataSource) {
			this.setState({
				authToken: userToken
			});
		}
	}

	// Begins by updating state with information found in local storage, then retrieves and stores fresh notebook information
	// from the API. If the user does not have a previous section selection in storage, or has not made a section selection yet,
	// additionally set the current section to the default section.
	retrieveAndUpdateNotebookAndSectionSelection(): Promise<SectionPickerState> {
		return new Promise<SectionPickerState>((resolve, reject) => {
			if (this.dataSourceUninitialized()) {
				this.setDataSource();
				this.setAuthToken();
			}

			this.setState({
				status: Status.InProgress
			});

			// Always set the values with what is in local storage, and when the XHR returns it will overwrite if necessary
			this.fetchCachedNotebookAndSectionInfoAsState((cachedInfoAsState: SectionPickerState) => {
				if (cachedInfoAsState) {
					this.setState(cachedInfoAsState);
					this.props.clipperState.setState({
						saveLocation: cachedInfoAsState.curSection && cachedInfoAsState.curSection.currentItemId ? cachedInfoAsState.curSection.currentItemId : ""
					});
				}

				let getNotebooksEvent: Log.Event.PromiseEvent = new Log.Event.PromiseEvent(Log.Event.Label.GetNotebooks);

				this.fetchFreshNotebooks(Clipper.getUserSessionId()).then((freshNotebooks) => {
					let correlationId = this.setCorrelationId();
					getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);

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

					getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.MaxDepth, OneNoteItemUtils.getDepthOfNotebooks(freshNotebooks));

					Clipper.storeValue(ClipperStorageKeys.cachedNotebooks, JSON.stringify(freshNotebooks));

					// The curSection property is the default section found in the notebook list
					let freshNotebooksAsState = SectionPickerClass.convertNotebookListToState(freshNotebooks);

					let shouldOverrideCurSectionWithDefault = true;
					if (this.state.curSection && this.state.curSection.currentItemId) {
						// The user has already selected a section ...
						let currentSectionStillExists = this.getCurrentSectionStillExists(freshNotebooks, this.state.curSection.currentItemId);
						if (currentSectionStillExists) {
							// ... which exists, so we don't override it with the default
							freshNotebooksAsState.curSection = this.state.curSection;
							shouldOverrideCurSectionWithDefault = false;
						}
						getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.CurrentSectionStillExists, currentSectionStillExists);
					}

					if (shouldOverrideCurSectionWithDefault) {
						// A default section was found, so we set it as currently selected since the user has not made a valid selection yet
						// curSection can be undefined if there's no default found, which is fine
						Clipper.storeValue(ClipperStorageKeys.currentSelectedSection, JSON.stringify(freshNotebooksAsState.curSection));
						this.props.clipperState.setState({ saveLocation: freshNotebooksAsState.curSection ? freshNotebooksAsState.curSection.currentItemId : undefined });
					}

					this.setState(freshNotebooksAsState);
					resolve(freshNotebooksAsState);
				}).catch((failure: OneNoteApi.RequestError) => {
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
		!this.props.clipperState.userResult.data.user.accessToken ||
		!ClipperStateUtilities.isUserLoggedIn(this.props.clipperState) ||
		this.state.authToken !== this.props.clipperState.userResult.data.user.accessToken;
	}

	private setCorrelationId(): string {
		const correlationID = this.setFourDigits() + this.setFourDigits() + '-' + this.setFourDigits() + '-' + this.setFourDigits() + '-' + this.setFourDigits() + '-' + this.setFourDigits() + this.setFourDigits() + this.setFourDigits();
		return correlationID;
	}

	private setFourDigits(): string {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	getCurrentSectionStillExists(freshNotebooks, id): boolean {
		if (OneNoteItemUtils.find(freshNotebooks, id) === undefined) {
			return false;
		} else {
			return true;
		}

	}

	// Retrieves the cached notebook list and last selected section from local storage in state form
	fetchCachedNotebookAndSectionInfoAsState(callback: (state: SectionPickerState) => void): void {
		Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
			Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection) => {
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
	fetchFreshNotebooks(sessionId: string): Promise<Notebook[]> {
		if (this.dataSourceUninitialized()) {
			this.setDataSource();
		}
		return SectionPickerClass.dataSource.getNotebooks();
	}

		// Given a notebook list, converts it to state form where the curSection is the expanded section (or undefined if not found)
	private static convertNotebookListToState(notebooks: Notebook[]): SectionPickerState {
			let pathToExpandedSection = OneNoteItemUtils.getPathFromNotebooksToSection(notebooks, s => s.expanded);
			let expandedSectionInfo = SectionPickerClass.formatSectionInfoForStorage(pathToExpandedSection);
			return {
				notebooks: notebooks,
				status: Status.Succeeded,
				curSection: expandedSectionInfo,
			};
	}

	private static formatSectionInfoForStorage(pathToSection: OneNoteItemUtils.SectionPathElement[]): { path: string, currentItemId: string } {
			if (!pathToSection || pathToSection.length === 0) {
				return undefined;
		}
		const section: Section = pathToSection[pathToSection.length - 1];
			return {
				path: pathToSection.map(elem => elem.name).join(" > "),
				currentItemId: section.id
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
						saveLocation: cachedInfoAsState.curSection && cachedInfoAsState.curSection.path ? cachedInfoAsState.curSection.currentItemId : ""
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
				curSectionId = this.state.curSection.currentItemId;
				textToDisplay = this.state.curSection.path;
			}
		}

		// If we can show a better message, especially an actionable one, we do
		if (this.state.apiResponseCode && !OneNoteApiUtils.isRetryable(this.state.apiResponseCode)) {
			localizedStrings.notebookLoadFailureMessage = OneNoteApiUtils.getLocalizedErrorMessageForGetNotebooks(this.state.apiResponseCode);
		}

		return (
			<div id={Constants.Ids.locationPickerContainer}>
				<div id={Constants.Ids.optionLabel} className="optionLabel" tabIndex={50}>
					<label className="buttonLabelFont" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
						{Localization.getLocalizedString("WebClipper.Label.ClipLocation")}
					</label>
				</div>
				<OneNotePicker
					globals={this.state.globals}
					notebooks={this.state.notebooks}
					status={Status[this.state.status]}
					onPopupToggle={this.onPopupToggle.bind(this)}
					onSectionClicked={this.onSectionClicked.bind(this)}
					dropdownLabel={textToDisplay}
					curSectionId={curSectionId}
					localizedStrings={localizedStrings} />
			</div>
		);
	}
}

let component = SectionPickerClass.componentize();
export {component as SectionPicker};
