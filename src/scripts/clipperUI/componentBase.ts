import {Constants} from "../constants";
import {Clipper} from "./frontEndGlobals";

export interface EnableInvokeParams {
	callback?: Function;
	tabIndex?: number;
	args?: any;
	idOverride?: string;
	verticalArrowKeyNavSet?: string;
	horizontalArrowKeyNavSet?: string;
}

export abstract class ComponentBase<TState, TProps> {
	public state: TState;
	public props: TProps;
	public refs: any;

	constructor(props: TProps) {
		this.props = props;
		this.state = this.getInitialState();
		this.refs = {};
	}

	public abstract render(props?: TProps);

	public getInitialState(): TState {
		return {} as TState;
	}

	public setState(newPartialState: TState) {
		m.startComputation();
		for (let key in newPartialState) {
			if (newPartialState.hasOwnProperty(key)) {
				this.state[key] = newPartialState[key];
			}
		}
		m.endComputation();
	}

	public ref(name: string) {
		return {
			config: (element: HTMLElement) => {
				this.refs[name] = element;
			}
		};
	}

	public onElementDraw(handleMethod: (element: HTMLElement, isFirstDraw: boolean) => void) {
		// Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
		handleMethod = handleMethod.bind(this);
		return {
			config: (element: HTMLElement, isInitialized: boolean) => {
				handleMethod(element, !isInitialized);
			}
		};
	}

	public onElementFirstDraw(handleMethod: (element: HTMLElement) => void) {
		// Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
		handleMethod = handleMethod.bind(this);
		return {
			config: (element: HTMLElement, isInitialized: boolean) => {
				if (!isInitialized) {
					handleMethod(element);
				}
			}
		};
	}

	/*
	 * Helper which handles tabIndex, clicks, and keyboard navigation.
	 *
	 * Also hides the outline if they are using a mouse, but shows it if they are using the keyboard
	 * (idea from http://www.paciellogroup.com/blog/2012/04/how-to-remove-css-outlines-in-an-accessible-manner/)
	 *
	 * Example use:
	 *      <a id="myCoolButton" {...this.enableInvoke(this.myButtonHandler, 0)}>Click Me</a>
	 */
	public enableInvoke({callback = undefined, tabIndex = 0, args = undefined, idOverride = undefined, verticalArrowKeyNavSet = undefined, horizontalArrowKeyNavSet = undefined}: EnableInvokeParams) {
		// Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
		if (callback) {
			callback = callback.bind(this, args);
		}

		let ariaSet = undefined;
		if (verticalArrowKeyNavSet) {
			ariaSet = verticalArrowKeyNavSet;
		}
		if (horizontalArrowKeyNavSet) {
			ariaSet = horizontalArrowKeyNavSet;
		}

		return {
			onclick: (e: MouseEvent) => {
				let element = e.currentTarget as HTMLElement;

				// Intentionally sending click event before handling the method
				// TODO replace this comment with a test that validates the call order is correct
				let id = idOverride ? idOverride : element.id;

				Clipper.logger.logClickEvent(id);

				if (callback) {
					callback(e);
				}
			},
			onkeyup: (e: KeyboardEvent) => {
				let element = e.currentTarget as HTMLElement;
				if (e.which === Constants.KeyCodes.enter || e.which === Constants.KeyCodes.space) {
					// Hitting Enter on <a> tags that contains an href automatically fire the click event, so don't do it again
					if (!(element.tagName === "A" && element.hasAttribute("href"))) {
						// Intentionally sending click event before handling the method
						// TODO replace this comment with a test that validates the call order is correct
						let id = element.id;

						Clipper.logger.logClickEvent(id);

						if (callback) {
							callback(e);
						}
					}
				} else if (e.which === Constants.KeyCodes.tab) {
					// Since they are using the keyboard, revert to the default value of the outline so it is visible
					element.style.outlineStyle = "";
				}

				if (!verticalArrowKeyNavSet && !horizontalArrowKeyNavSet) {
					return;
				} else {
					if (element.hasAttribute("data-" + Constants.CustomHtmlAttributes.setNameForArrowKeyNav)) {
						let posInSet = parseInt(element.getAttribute("aria-posinset"), 10);
						if (e.which === Constants.KeyCodes.home) {
							let firstInSet = 1;
							ComponentBase.focusOnButton(verticalArrowKeyNavSet, firstInSet, e);
						} else if (e.which === Constants.KeyCodes.end) {
							let lastInSet = parseInt(element.getAttribute("aria-setsize"), 10);
							ComponentBase.focusOnButton(verticalArrowKeyNavSet, lastInSet, e);
						}

						if (verticalArrowKeyNavSet) {
							if (e.which === Constants.KeyCodes.up) {
								if (posInSet === 1) {
									return;
								}
								let nextPosInSet = posInSet - 1;
								ComponentBase.focusOnButton(verticalArrowKeyNavSet, nextPosInSet, e);
							} else if (e.which === Constants.KeyCodes.down) {
								let setSize = parseInt(element.getAttribute("aria-setsize"), 10);
								if (posInSet === setSize) {
									return;
								}
								let nextPosInSet = posInSet + 1;
								ComponentBase.focusOnButton(verticalArrowKeyNavSet, nextPosInSet, e);
							}
						}

						if (horizontalArrowKeyNavSet) {
							if (e.which === Constants.KeyCodes.left) {
								if (posInSet === 1) {
									return;
								}
								let nextPosInSet = posInSet - 1;
								ComponentBase.focusOnButton(horizontalArrowKeyNavSet, nextPosInSet, e);
							} else if (e.which === Constants.KeyCodes.right) {
								let setSize = parseInt(element.getAttribute("aria-setsize"), 10);
								if (posInSet === setSize) {
									return;
								}
								let nextPosInSet = posInSet + 1;
								ComponentBase.focusOnButton(horizontalArrowKeyNavSet, nextPosInSet, e);
							}
						}
					}
				}
			}
			,
			onmousedown: (e: MouseEvent) => {
				let element = e.currentTarget as HTMLElement;
				element.style.outlineStyle = "none";
			},
			tabIndex: tabIndex,
			"data-setnameforarrowkeynav": ariaSet
		};
	}

	private static focusOnButton(setNameForArrowKeyNav: string, posInSet: number, e: KeyboardEvent) {
		e.preventDefault();
		const buttons = document.querySelectorAll("[data-" + Constants.CustomHtmlAttributes.setNameForArrowKeyNav + "=" + setNameForArrowKeyNav + "]");
		for (let i = 0; i < buttons.length; i++) {
			let selectable = buttons[i] as HTMLElement;
			let ariaIntForEach = parseInt(selectable.getAttribute("aria-posinset"), 10);
			if (ariaIntForEach === posInSet) {
				selectable.style.outlineStyle = "";
				selectable.focus();
				return;
			}
		}
	}

	// Note: currently all components NEED either a child or attribute to work with the MSX transformer.
	// This <MyButton/> won't work, but this <MyButton dummyProp /> will work.
	public static componentize() {
		let returnValue: any = () => {
		};
		returnValue.controller = (props: any) => {
			// Instantiate an instance of the inheriting class
			return new (<any>this)(props);
		};
		returnValue.view = (controller: any, props: any) => {
			controller.props = props;
			return controller.render();
		};

		return returnValue;
	}
}
