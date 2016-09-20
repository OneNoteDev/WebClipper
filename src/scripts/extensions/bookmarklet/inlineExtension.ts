import {ClientType} from "../../clientType";

import {TooltipType} from "../../clipperUI/tooltipType";

import {InlineMessageHandler} from "../../communicator/inlineMessageHandler";

import {ClipperData} from "../../storage/clipperData";
import {LocalStorage} from "../../storage/localStorage";

import {ExtensionBase} from "../extensionBase";

import {InlineWorker} from "./inlineWorker";

/**
 * This class is used for the cases where we don't really have an extension running in the background
 * for us to talk to. For example, when the clipper is invoked via bookmarklet. There is still
 * functionality that we need from the "background" that we can provide within the clipper ui itself.
 * To simplify and hide that distinction away from the rest of the code, we create this "inlined" extension
 * to provide the functionality we need.
 *
 * Due to the 'uniqueness' of the inline extension, stub method implementations are treated as scenarios
 * that don't make sense, and are assumed to be intentional. 
 *
 * Note: this is determined by the InjectOptions.useInlineBackgroundWorker flag
 */
export class InlineExtension extends ExtensionBase<InlineWorker, any, any> {
	private worker: InlineWorker;

	constructor() {
		super(ClientType.Bookmarklet, new ClipperData(new LocalStorage()));

		this.worker = new InlineWorker(this.clientInfo, this.auth);
		this.addWorker(this.worker);
	}

	getIdFromTab(tab: any): any {
		return undefined;
	}

	public getInlineMessageHandler(): InlineMessageHandler {
		return this.worker.getUiMessageHandler();
	}

	public getUniqueId(): SafariBrowserTab {
		return undefined;
	}

	protected addPageNavListener(callback: (tab: any) => void) {
	}

	protected checkIfTabMatchesATooltipType(tab: SafariBrowserTab, tooltipTypes: TooltipType[]): TooltipType {
		return undefined;
	}

	protected checkIfTabIsAVideoDomain(tab: SafariBrowserTab): boolean {
		return false;
	}

	protected checkIfTabIsOnWhitelistedUrl(tab: any): boolean {
		return false;
	}

	protected createWorker(tab: any): InlineWorker {
		return undefined;
	}

	protected onFirstRun() {
	}
}
