import {Constants} from "../constants";
import {Clipper} from "./frontEndGlobals";
import {AriaNavDirection} from "./AriaNavDirection";

export interface EnableInvokeParams {
	callback?: Function;
	tabIndex?: number;
	args?: any;
	idOverride?: string;
}

export interface EnableAriaParams extends EnableInvokeParams {
	ariaSetName: string;
	ariaSetDirection: AriaNavDirection;
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
	 * Helper which handles tabIndex, clicks, and keyboard navigation for a component that is part of an Aria Set
	*
	 * Also hides the outline if they are using a mouse, but shows it if they are using the keyboard
	 * (idea from http://www.paciellogroup.com/blog/2012/04/how-to-remove-css-outlines-in-an-accessible-manner/)
	 */
	enableAriaInvoke({callback = undefined, tabIndex = 0, args = undefined, idOverride = undefined, ariaSetName = undefined, ariaSetDirection = undefined}: EnableAriaParams) {
		if (callback) {
			callback = callback.bind(this, args);
		}

		return {
			onclick: (e: MouseEvent) => {
				ComponentBase.handleOnClick(e, idOverride, callback);
			},
			onkeyup: (e: KeyboardEvent) => {
				let element = e.currentTarget as HTMLElement;
				e.preventDefault();
				ComponentBase.handleEnterAndSpaceKey(e, element, callback);
				ComponentBase.handleTabKey(e, element);
				ComponentBase.handleHomeAndEndButtons(e, ariaSetName, element);

				if (element.hasAttribute("data-" + Constants.CustomHtmlAttributes.setNameForArrowKeyNav)) {
					let posInSet = parseInt(element.getAttribute("aria-posinset"), 10);
					let increment = undefined;
					let decrement = undefined;

					if (ariaSetDirection === AriaNavDirection.Vertical) {
						increment = Constants.KeyCodes.up;
						decrement = Constants.KeyCodes.down;
					} else if (ariaSetDirection === AriaNavDirection.Horizontal) {
						increment = Constants.KeyCodes.left;
						decrement = Constants.KeyCodes.right;
					}

					if (e.which === increment) {
						if (posInSet === 1) {
							return;
						}
						let nextPosInSet = posInSet - 1;
						ComponentBase.focusOnButton(ariaSetName, nextPosInSet);
					} else if (e.which === decrement) {
						let setSize = parseInt(element.getAttribute("aria-setsize"), 10);
						if (posInSet === setSize) {
							return;
						}
						let nextPosInSet = posInSet + 1;
						ComponentBase.focusOnButton(ariaSetName, nextPosInSet);
					}

				}
			},
			onmousedown: (e: MouseEvent) => {
				let element = e.currentTarget as HTMLElement;
				element.style.outlineStyle = "none";
			},
			tabIndex: tabIndex,
			"data-setnameforarrowkeynav": ariaSetName
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
	public enableInvoke({callback = undefined, tabIndex = 0, args = undefined, idOverride = undefined}: EnableInvokeParams) {
		// Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
		if (callback) {
			callback = callback.bind(this, args);
		}

		return {
			onclick: (e: MouseEvent) => {
				ComponentBase.handleOnClick(e, idOverride, callback);
			},
			onkeyup: (e: KeyboardEvent) => {
				let element = e.currentTarget as HTMLElement;
				ComponentBase.handleEnterAndSpaceKey(e, element, callback);
				ComponentBase.handleTabKey(e, element);
			}
			,
			onmousedown: (e: MouseEvent) => {
				let element = e.currentTarget as HTMLElement;
				element.style.outlineStyle = "none";
			},
			tabIndex: tabIndex,
		};
	}

	private static handleEnterAndSpaceKey(e: KeyboardEvent, element: HTMLElement, callback: Function) {
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
		}
	}

	private static handleTabKey(e: KeyboardEvent, element: HTMLElement) {
		if (e.which === Constants.KeyCodes.tab) {
			// Since they are using the keyboard, revert to the default value of the outline so it is visible
			element.style.outlineStyle = "";
		}
	}

	private static handleOnClick(e: MouseEvent, idOverride: string, callback: Function) {
		let element = e.currentTarget as HTMLElement;

		// Intentionally sending click event before handling the method
		// TODO replace this comment with a test that validates the call order is correct
		let id = idOverride ? idOverride : element.id;

		Clipper.logger.logClickEvent(id);

		if (callback) {
			callback(e);
		}
	}

	private static handleHomeAndEndButtons(e: KeyboardEvent, setName: string, element: HTMLElement) {
		if (e.which === Constants.KeyCodes.home) {
			let firstInSet = 1;
			ComponentBase.focusOnButton(setName, firstInSet);
		} else if (e.which === Constants.KeyCodes.end) {
			let lastInSet = parseInt(element.getAttribute("aria-setsize"), 10);
			ComponentBase.focusOnButton(setName, lastInSet);
		}
	}

	private static focusOnButton(setNameForArrowKeyNav: string, posInSet: number) {
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
