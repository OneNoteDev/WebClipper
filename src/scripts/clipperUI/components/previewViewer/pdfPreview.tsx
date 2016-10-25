/// <reference path="../../../../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {Constants} from "../../../constants";
import {PdfPreviewInfo} from "../../../previewInfo";
import {StringUtils} from "../../../stringUtils";
import {Utils} from "../../../utils";

import {SmartValue} from "../../../communicator/smartValue";

import {FullPageScreenshotResult} from "../../../contentCapture/fullPageScreenshotHelper";
import {PdfScreenshotResult} from "../../../contentCapture/pdfScreenshotHelper";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp, DataResult} from "../../clipperState";
import {Status} from "../../status";

import {RotatingMessageSpriteAnimation} from "../../components/rotatingMessageSpriteAnimation";

import {PdfPreviewAttachment} from "./pdfPreviewAttachment";
import {PdfPreviewPage} from "./pdfPreviewPage";
import {PreviewComponentBase} from "./previewComponentBase";
import {PreviewViewerPdfHeader} from "./previewViewerPdfHeader";

import * as _ from "lodash";

type IndexToDataUrlMap = { [index: number]: string; }

interface PdfPreviewState {
	showPageNumbers?: boolean;
	invalidRange?: boolean; // TODO this is probably a duplication of info
	renderedPages?: IndexToDataUrlMap; // This is indexed from 1
}

// TODO change name to PdfPreviewClass
class PdfPreview extends PreviewComponentBase<PdfPreviewState, ClipperStateProp> {
	private static latestScrollListener: (event: UIEvent) => void;
	private static scrollListenerTimeout: number;
	private initPageRenderCalled: boolean = false;

	constructor(props: ClipperStateProp) {
		super(props);
		// We need to do this on every constructor to ensure the reference to the state
		// object is correct
		this.addScrollListener();
	}

	getInitialState(): PdfPreviewState {
		return {
			showPageNumbers: false,
			renderedPages: {}
		};
	}

	/**
	 * Determines which pages are in view of the preview and updates the state with their indexes
	 * TODO rename
	 */
	private updateRenderedPages() {
		let allPages = document.querySelectorAll("div[data-pageindex]");
		let pagesToRender: number[] = [];

		// Naive
		for (let i = 0; i < allPages.length; i++) {
			let currentPage = allPages[i] as HTMLDivElement;
			if (this.pageIsVisible(currentPage)) {
				pagesToRender.push(parseInt((currentPage.dataset as any).pageindex, 10) + 1);
			}
		}

		if (pagesToRender.length > 0) {
			let first = pagesToRender[0];
			let extraPagesToPrepend = _.range(Math.max(first - Constants.Settings.pdfExtraPageLoadEachSide, 1), first);

			let last = pagesToRender[pagesToRender.length - 1];
			let extraPagesToAppend = _.range(last, Math.min(last + Constants.Settings.pdfExtraPageLoadEachSide, this.props.clipperState.pdfResult.data.get().pdf.numPages)).map((index) => index + 1);

			pagesToRender = extraPagesToPrepend.concat(pagesToRender).concat(extraPagesToAppend);
		}

		this.setStateWithDataUrls(pagesToRender).then((renderedPages) => {
			this.setState({
				renderedPages: renderedPages
			});
		});
	}

	private pageIsVisible(element: HTMLElement): boolean {
		let rect = element.getBoundingClientRect();
		return rect.top <= window.innerHeight && rect.bottom >= 0;
	}

	private setStateWithDataUrls(pagesToRender: number[]): Promise<IndexToDataUrlMap> {
		let renderedPages: IndexToDataUrlMap = {};

		return new Promise<IndexToDataUrlMap>((resolve) => {
			let resolveIfDone = () => {
				if (this.isRenderedPagesObjComplete(renderedPages, pagesToRender)) {
					resolve(renderedPages);
				}
			};

			for (let i = 0; i < pagesToRender.length; i++) {
				let pageToRender = pagesToRender[i];
				if (this.state.renderedPages[pageToRender]) {
					// Optimization: we already have the data url for this page in state, so no point going through the proxy
					renderedPages[pageToRender] = this.state.renderedPages[pageToRender];
					resolveIfDone();
				} else {
					this.props.clipperState.pdfResult.data.get().pdf.getPage(pageToRender).then((page) => {
						let viewport = page.getViewport(1 /* scale */);
						let canvas = document.createElement("canvas") as HTMLCanvasElement;
						let context = canvas.getContext("2d");
						canvas.height = viewport.height;
						canvas.width = viewport.width;

						let renderContext = {
							canvasContext: context,
							viewport: viewport
						};

						// Rendering is async so results may come back in any order
						page.render(renderContext).then(() => {
							renderedPages[pageToRender] = canvas.toDataURL();
							resolveIfDone();
						});
					});
				}
			}
		});
	}

	private isRenderedPagesObjComplete(renderedPages: IndexToDataUrlMap, pagesToRender: number[]): boolean {
		for (let i = 0; i < pagesToRender.length; i++) {
			if (!renderedPages[pagesToRender[i]]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Gets the page components to be rendered in the preview
	 */
	private getPageComponents(): any[] {
		let pages = [];
		let pdfResult = this.props.clipperState.pdfResult.data.get();

		// Determine which pages should be marked as selected vs unselected
		let pagesToShow = StringUtils.parsePageRange(this.props.clipperState.pdfPreviewInfo.selectedPageRange);
		if (!pagesToShow) {
			pagesToShow = [];
		}
		pagesToShow = pagesToShow.map((ind) => { return ind - 1; });

		for (let i = 0; i < pdfResult.pdf.numPages; i++) {
			pages.push(<PdfPreviewPage showPageNumber={this.state.showPageNumbers} isSelected={this.props.clipperState.pdfPreviewInfo.allPages || pagesToShow.indexOf(i) >= 0}
				viewportDimensions={pdfResult.viewportDimensions[i]} imgUrl={this.state.renderedPages[i + 1]} index={i} />);
		}
		return pages;
	}

	private addScrollListener() {
		if (PdfPreview.latestScrollListener) {
			window.removeEventListener("scroll", PdfPreview.latestScrollListener, true);
		}
		// When we detect a scroll, show page numbers immediately.
		// When the user doesn't scroll for some period of time, fade them out.
		PdfPreview.latestScrollListener = (event) => {
			let element = event.target as HTMLElement;
			if (!!element && element.id === Constants.Ids.previewContentContainer) {
				if (Utils.isNumeric(PdfPreview.scrollListenerTimeout)) {
					clearTimeout(PdfPreview.scrollListenerTimeout);
				}
				PdfPreview.scrollListenerTimeout = setTimeout(() => {
					this.setState({
						showPageNumbers: false
					});
					// TODO piggybacking this for now
					if (this.props.clipperState.pdfResult.status === Status.Succeeded) {
						this.updateRenderedPages();
					}
				}, Constants.Settings.timeUntilPdfPageNumbersFadeOutAfterScroll);

				// A little optimization to prevent us from calling render a large number of times
				if (!this.state.showPageNumbers) {
					this.setState({
						showPageNumbers: true
					});
				}
			}
		};
		// TODO does this work on touch and pageup/down too?
		window.addEventListener("scroll", PdfPreview.latestScrollListener, true /* allows the listener to listen to all elements */);
	}

	protected getContentBodyForCurrentStatus(): any[] {
		let state = this.props.clipperState;
		if (state.pdfResult.status === Status.InProgress || state.pdfResult.status === Status.NotStarted) {
			return [this.getSpinner()];
		}

		return this.convertPdfResultToContentData(state.pdfResult);
	}

	onSelectionChange(selection: boolean) {
		// TODO: change this to _.assign, _.extend
		let newPdfPreviewInfo = Utils.createUpdatedObject(this.props.clipperState.pdfPreviewInfo, {
			allPages: selection
		} as PdfPreviewInfo);

		this.props.clipperState.setState({
			pdfPreviewInfo: newPdfPreviewInfo
		});
	}

	onTextChange(text: string) {
		// TODO: change this to _.assign, _.extend
		let newPdfPreviewInfo = Utils.createUpdatedObject(this.props.clipperState.pdfPreviewInfo, {
			selectedPageRange: text
		} as PdfPreviewInfo);

		this.props.clipperState.setState({
			pdfPreviewInfo: newPdfPreviewInfo
		});

		let pagesToShow = StringUtils.parsePageRange(text);
		if (!pagesToShow) {
			this.setState({
				invalidRange: true
			});
		} else {
			this.setState({
				invalidRange: false
			});
		}
	}

	onCheckboxChange(checked: boolean) {
		let newPdfPreviewInfo = Utils.createUpdatedObject(this.props.clipperState.pdfPreviewInfo, {
			shouldAttachPdf: checked
		} as PdfPreviewInfo);

		this.props.clipperState.setState({
			pdfPreviewInfo: newPdfPreviewInfo
		});
	}

	protected getHeader(): any {
		return <PreviewViewerPdfHeader
			invalidRange={this.state.invalidRange}
			shouldAttachPdf={this.props.clipperState.pdfPreviewInfo.shouldAttachPdf}
			allPages={this.props.clipperState.pdfPreviewInfo.allPages}
			onCheckboxChange={this.onCheckboxChange.bind(this)}
			onSelectionChange={this.onSelectionChange.bind(this)}
			onTextChange={this.onTextChange.bind(this)}
			clipperState={this.props.clipperState} />;
	}

	protected getStatus(): Status {
		if (!this.props.clipperState.pageInfo) {
			return Status.NotStarted;
		}
		return this.props.clipperState.pdfResult.status;
	}

	protected getTitleTextForCurrentStatus(): string {
		let noContentFoundString = Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
		let failureMessage: string;

		let previewStatus = this.getStatus();
		let pdfResult = this.props.clipperState.pdfResult;
		switch (previewStatus) {
			case Status.Succeeded:
				// TODO: verify this is actually what happens
				if (pdfResult && !pdfResult.data.get()) {
					return Localization.getLocalizedString("WebClipper.Preview.NoContentFound");
				}
				return this.props.clipperState.previewGlobalInfo.previewTitleText;
			case Status.NotStarted:
			case Status.InProgress:
				return Localization.getLocalizedString("WebClipper.Preview.LoadingMessage");
			default:
			case Status.Failed:
				failureMessage = this.props.clipperState.pdfResult.data.get().failureMessage;
				return !!failureMessage ? failureMessage : noContentFoundString;
		}
	}

	private convertPdfResultToContentData(result: DataResult<SmartValue<PdfScreenshotResult>>): any[] {
		let contentBody = [];
		switch (result.status) {
			case Status.Succeeded:
				if (!this.initPageRenderCalled) {
					this.initPageRenderCalled = true;
					this.setStateWithDataUrls([1, 2, 3]).then((renderedPages) => {
						this.setState({
							renderedPages: renderedPages
						});
					});
				}

				// In OneNote we don't display the extension
				let shouldAttachPdf = this.props.clipperState.pdfPreviewInfo.shouldAttachPdf;
				let defaultAttachmentName = "Original.pdf";
				let fullAttachmentName = this.props.clipperState.pageInfo ? Utils.getFileNameFromUrl(this.props.clipperState.pageInfo.rawUrl, defaultAttachmentName) : defaultAttachmentName;
				if (shouldAttachPdf) {
					contentBody.push(<PdfPreviewAttachment name={fullAttachmentName.split(".")[0]}/>);
				}

				contentBody = contentBody.concat(this.getPageComponents());
				break;
			case Status.NotStarted:
			case Status.InProgress:
				contentBody.push(this.getSpinner());
				break;
			default:
			case Status.Failed:
				break;
		}
		return contentBody;
	}

	private getSpinner(): any {
		let spinner = <RotatingMessageSpriteAnimation
			spriteUrl={Utils.getImageResourceUrl("spinner_loop_colored.png") }
			imageHeight={65}
			imageWidth={45}
			totalFrameCount={21}
			loop={true} />;
		return <div className={Constants.Classes.centeredInPreview}>{spinner}</div>;
	}
}

let component = PdfPreview.componentize();
export {component as PdfPreview};
