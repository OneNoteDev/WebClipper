import {Constants} from "../constants";
import {Clipper} from "./frontEndGlobals";

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
	public enableInvoke(handleMethod: Function, tabIndex = 0, args?: any, idOverride: string = undefined, setNameForArrowKeyNav: string = undefined, defaultAction: string = undefined) {
		// Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
		if (handleMethod) {
			handleMethod = handleMethod.bind(this, args);
		}

		return {
			onclick: (e: MouseEvent) => {
				let element = e.currentTarget as HTMLElement;

				// Intentionally sending click event before handling the method
				// TODO replace this comment with a test that validates the call order is correct
				let id = idOverride ? idOverride : element.id;

				Clipper.logger.logClickEvent(id);

				if (handleMethod) {
					handleMethod(e);
				}
			},
			onkeyup: (e: KeyboardEvent) => {
				let element = e.currentTarget as HTMLElement;
				if (e.which === Constants.KeyCodes.space) {
					ComponentBase.triggerActionEvent(element, handleMethod, e);
				} else if (e.which === Constants.KeyCodes.tab) {
					// Since they are using the keyboard, revert to the default value of the outline so it is visible
					element.style.outlineStyle = "";
				}

				if (!setNameForArrowKeyNav && !defaultAction) {
					ComponentBase.enterKeySelection(e);
					return;
				} else if (element.hasAttribute("data-" + Constants.AriaSet.setNameForArrowKeyNav)) {
					let posInSet = parseInt(element.getAttribute("aria-posinset"), 10);
					if (e.which === Constants.KeyCodes.up) {
						if (posInSet === 1) {
							return;
						}
						let nextPosInSet = posInSet - 1;
						ComponentBase.focusOnButton(setNameForArrowKeyNav, nextPosInSet);
					} else if (e.which === Constants.KeyCodes.down) {
						let setSize = parseInt(element.getAttribute("aria-setsize"), 10);
						if (posInSet === setSize) {
							return;
						}
						let nextPosInSet = posInSet + 1;
						ComponentBase.focusOnButton(setNameForArrowKeyNav, nextPosInSet);
					} else if (!defaultAction) {
						ComponentBase.enterKeySelection(e);
					} else if (e.which === Constants.KeyCodes.enter) {
						ComponentBase.triggerActionEvent(element, handleMethod, e);
					}
				}
			},
			onmousedown: (e: MouseEvent) => {
				let element = e.currentTarget as HTMLElement;
				element.style.outlineStyle = "none";
			},
			tabIndex: tabIndex,
			"data-setnameforarrowkeynav": setNameForArrowKeyNav,
			"data-defaultaction": defaultAction
		};
	}

	private static enterKeySelection(e: KeyboardEvent) {
		if (e.which === Constants.KeyCodes.enter) {
			let defaultActionElement = document.querySelector("[data-defaultaction]:not([data-defaultaction='undefined'])");
			let defaultActionElementHtml = defaultActionElement as HTMLElement;
			if (!!defaultActionElementHtml) {
				defaultActionElementHtml.click();
			}
		}
	}

	private static triggerActionEvent(element, handleMethod: Function, e: KeyboardEvent) {
// Hitting Enter on <a> tags that contains an href automatically fire the click event, so don't do it again
		if (!(element.tagName === "A" && element.hasAttribute("href"))) {
			// Intentionally sending click event before handling the method
			// TODO replace this comment with a test that validates the call order is correct
			let id = element.id;

			Clipper.logger.logClickEvent(id);

			if (handleMethod) {
				handleMethod(e);
			}
		}
	}

	private static focusOnButton(setNameForArrowKeyNav: string, nextPosInSet: number) {
		const buttons = document.querySelectorAll("[data-" + Constants.AriaSet.setNameForArrowKeyNav + "=" + setNameForArrowKeyNav + "]");
		for (let i = 0; i < buttons.length; i++) {
			let selectable = buttons[i] as HTMLElement;
			let ariaIntForEach = parseInt(selectable.getAttribute("aria-posinset"), 10);
			if (ariaIntForEach === nextPosInSet) {
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
