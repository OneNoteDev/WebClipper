/// <reference path="../../../../node_modules/onenotepicker/target/oneNotePicker.d.ts"/>
/// <reference path="../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import * as Log from "../../logging/log";
import {Settings} from "../../settings";
import {ClipperStorageKeys} from "../../storage/clipperStorageKeys";
import {ClipperStateProp} from "../clipperState";
import {ClipperStateUtilities} from "../clipperStateUtilities";
import {ComponentBase} from "../componentBase";
import {Clipper} from "../frontEndGlobals";
import {OneNoteApiUtils} from "../oneNoteApiUtils";
import { Status } from "../status";

export interface SectionPickerState {
	notebooks?: OneNoteApi.Notebook[];
	status?: Status;
	apiResponseCode?: string;
	curSection?: {
		path: string;
		section: OneNoteApi.Section;
	};
	keyboardNavigationHandler?: (e: KeyboardEvent) => void;
}

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
					let correlationId = responsePackage.request.getResponseHeader(Constants.HeaderValues.correlationId);
					getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.CorrelationId, correlationId);

					let freshNotebooks = responsePackage.parsedResponse;
					if (!freshNotebooks) {
						getNotebooksEvent.setStatus(Log.Status.Failed);
						let error = {error: "GetNotebooks Promise was resolved but returned null or undefined value for notebooks."};
						getNotebooksEvent.setFailureInfo(error);
						this.setState({
							status: Status.Failed
						});
						reject(error);
						return;
					}

					getNotebooksEvent.setCustomProperty(Log.PropertyName.Custom.MaxDepth, OneNoteApi.NotebookUtils.getDepthOfNotebooks(freshNotebooks));

					Clipper.storeValue(ClipperStorageKeys.cachedNotebooks, JSON.stringify(freshNotebooks));

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
						// curSection can be undefined if there's no default found, which is fine
						Clipper.storeValue(ClipperStorageKeys.currentSelectedSection, JSON.stringify(freshNotebooksAsState.curSection));
						this.props.clipperState.setState({saveLocation: freshNotebooksAsState.curSection ? freshNotebooksAsState.curSection.section.id : undefined});
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
			!SectionPickerClass.dataSource.authToken ||
			!ClipperStateUtilities.isUserLoggedIn(this.props.clipperState) ||
			(SectionPickerClass.dataSource.authToken !== this.props.clipperState.userResult.data.user.accessToken);
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
	fetchFreshNotebooks(sessionId: string): Promise<OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>> {
		if (this.dataSourceUninitialized()) {
			this.setDataSource();
		}

		let headers: { [key: string]: string } = {};
		headers[Constants.HeaderValues.appIdKey] = Settings.getSetting("App_Id");
		headers[Constants.HeaderValues.userSessionIdKey] = sessionId;

		return SectionPickerClass.dataSource.getNotebooks(headers);
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

	addSrOnlyLocationDiv(element: HTMLElement) {
		const pickerLinkElement = document.getElementById(Constants.Ids.sectionLocationContainer);
		if (!pickerLinkElement) {
			Clipper.logger.logTrace(Log.Trace.Label.General, Log.Trace.Level.Warning, `Unable to add sr-only div: Parent element with id ${Constants.Ids.sectionLocationContainer} not found`);
			return;
		}
		const srDiv = document.createElement("div");
		srDiv.textContent = Localization.getLocalizedString("WebClipper.Label.ClipLocation") + ": ";
		srDiv.setAttribute("class", Constants.Classes.srOnly);
		// Make srDiv the first child of pickerLinkElement
		pickerLinkElement.insertBefore(srDiv, pickerLinkElement.firstChild);
	}

	// Keyboard navigation handler for the OneNotePicker tree
	handlePickerKeyboardNavigation(element: HTMLElement, isFirstDraw: boolean) {
		// Clean up existing handler if it exists
		if (this.state.keyboardNavigationHandler) {
			document.removeEventListener("keydown", this.state.keyboardNavigationHandler, true);
		}

		if (!isFirstDraw) {
			return;
		}

		const keydownHandler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;

			// Only handle keyboard events when focus is within the picker tree
			const pickerContainer = document.getElementById(Constants.Ids.sectionLocationContainer);
			if (!pickerContainer || !pickerContainer.contains(target)) {
				return;
			}

			// Get all focusable tree items (notebooks and sections)
			const treeItemsNodeList = document.querySelectorAll('[role="treeitem"]');
			const treeItems: HTMLElement[] = [];
			for (let i = 0; i < treeItemsNodeList.length; i++) {
				treeItems.push(treeItemsNodeList[i] as HTMLElement);
			}
			if (treeItems.length === 0) {
				return;
			}

			// Find currently focused item
			let currentIndex = -1;
			for (let i = 0; i < treeItems.length; i++) {
				if (treeItems[i] === document.activeElement || treeItems[i].contains(document.activeElement)) {
					currentIndex = i;
					break;
				}
			}
			if (currentIndex === -1) {
				currentIndex = 0;
			}

			let handled = false;

			switch (e.which) {
				case Constants.KeyCodes.down:
					// Move to next visible tree item
					if (currentIndex < treeItems.length - 1) {
						let nextIndex = currentIndex + 1;
						while (nextIndex < treeItems.length) {
							// Check if the item is visible
							const nextItem = treeItems[nextIndex];
							if (this.isTreeItemVisible(nextItem)) {
								nextItem.focus();
								break;
							}
							nextIndex++;
						}
					}
					handled = true;
					break;

				case Constants.KeyCodes.up:
					// Move to previous visible tree item
					if (currentIndex > 0) {
						let prevIndex = currentIndex - 1;
						while (prevIndex >= 0) {
							// Check if the item is visible
							const prevItem = treeItems[prevIndex];
							if (this.isTreeItemVisible(prevItem)) {
								prevItem.focus();
								break;
							}
							prevIndex--;
						}
					}
					handled = true;
					break;

				case Constants.KeyCodes.right:
					// Expand collapsed item or move to first child
					const currentItem = treeItems[currentIndex];
					const isExpanded = currentItem.getAttribute("aria-expanded") === "true";
					if (currentItem.hasAttribute("aria-expanded") && !isExpanded) {
						// Item can be expanded, click it to expand
						currentItem.click();
					} else if (isExpanded && currentIndex < treeItems.length - 1) {
						// Already expanded, move to first child
						let nextIndex = currentIndex + 1;
						const nextItem = treeItems[nextIndex];
						if (this.isTreeItemVisible(nextItem) && this.isChildOf(nextItem, currentItem)) {
							nextItem.focus();
						}
					}
					handled = true;
					break;

				case Constants.KeyCodes.left:
					// Collapse expanded item or move to parent
					const currentItemLeft = treeItems[currentIndex];
					const isExpandedLeft = currentItemLeft.getAttribute("aria-expanded") === "true";
					if (currentItemLeft.hasAttribute("aria-expanded") && isExpandedLeft) {
						// Item is expanded, collapse it
						currentItemLeft.click();
					} else {
						// Move to parent item
						const parentItem = this.findParentTreeItem(currentItemLeft);
						if (parentItem) {
							parentItem.focus();
						}
					}
					handled = true;
					break;

				case Constants.KeyCodes.home:
					// Move to first tree item
					if (treeItems.length > 0 && this.isTreeItemVisible(treeItems[0])) {
						treeItems[0].focus();
					}
					handled = true;
					break;

				case Constants.KeyCodes.end:
					// Move to last visible tree item
					for (let i = treeItems.length - 1; i >= 0; i--) {
						if (this.isTreeItemVisible(treeItems[i])) {
							treeItems[i].focus();
							break;
						}
					}
					handled = true;
					break;

				default:
					// No action needed for other keys
					break;
			}

			if (handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		// Store handler reference and add event listener
		this.setState({ keyboardNavigationHandler: keydownHandler });
		document.addEventListener("keydown", keydownHandler, true);
	}

	// Helper function to check if a tree item is visible
	private isTreeItemVisible(item: HTMLElement): boolean {
		if (!item) {
			return false;
		}
		// Check if item or its parent containers are hidden
		let current: HTMLElement = item;
		while (current && current !== document.body) {
			const style = window.getComputedStyle(current);
			if (style.display === "none" || style.visibility === "hidden") {
				return false;
			}
			// Check if parent is collapsed
			const parent = current.parentElement;
			if (parent && parent.classList.contains("Closed")) {
				return false;
			}
			current = parent;
		}
		return true;
	}

	// Helper function to check if an item is a child of another
	private isChildOf(child: HTMLElement, parent: HTMLElement): boolean {
		let current = child.parentElement;
		while (current && current !== document.body) {
			if (current === parent) {
				return true;
			}
			// Check if we've moved up to a sibling tree item
			if (current.getAttribute("role") === "treeitem" && current !== parent) {
				return false;
			}
			current = current.parentElement;
		}
		return false;
	}

	// Helper function to find parent tree item
	private findParentTreeItem(item: HTMLElement): HTMLElement | undefined {
		// Walk up the DOM to find the parent tree item
		let current = item.parentElement;
		while (current && current !== document.body) {
			if (current.getAttribute("role") === "treeitem") {
				return current;
			}
			current = current.parentElement;
		}
		return undefined;
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

		// If we can show a better message, especially an actionable one, we do
		if (this.state.apiResponseCode && !OneNoteApiUtils.isRetryable(this.state.apiResponseCode)) {
			localizedStrings.notebookLoadFailureMessage = OneNoteApiUtils.getLocalizedErrorMessageForGetNotebooks(this.state.apiResponseCode);
		}

		let locationString = Localization.getLocalizedString("WebClipper.Label.ClipLocation");

		return (
			<div id={Constants.Ids.locationPickerContainer} {...this.onElementDraw(this.handlePickerKeyboardNavigation)} {...this.onElementFirstDraw(this.addSrOnlyLocationDiv)}>
				<div id={Constants.Ids.optionLabel} className="optionLabel">
					<label htmlFor={Constants.Ids.sectionLocationContainer} aria-label={locationString} className="buttonLabelFont" style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
						<span aria-hidden="true">{locationString}</span>
					</label>
				</div>
				<OneNotePicker.OneNotePickerComponent
					id={Constants.Ids.sectionLocationContainer}
					tabIndex={70}
					notebooks={this.state.notebooks}
					status={Status[this.state.status]}
					onPopupToggle={this.onPopupToggle.bind(this)}
					onSectionClicked={this.onSectionClicked.bind(this)}
					textToDisplay={textToDisplay}
					curSectionId={curSectionId}
					localizedStrings={localizedStrings}/>
			</div>
		);
	}
}

let component = SectionPickerClass.componentize();
export {component as SectionPicker};
