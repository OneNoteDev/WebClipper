import {Constants} from "../../../constants";
import {ObjectUtils} from "../../../objectUtils";
import {PdfPreviewInfo} from "../../../previewInfo";
import {StringUtils} from "../../../stringUtils";
import {UrlUtils} from "../../../urlUtils";

import {SmartValue} from "../../../communicator/smartValue";

import {FullPageScreenshotResult} from "../../../contentCapture/fullPageScreenshotHelper";
import {PdfScreenshotHelper, PdfScreenshotResult} from "../../../contentCapture/pdfScreenshotHelper";

import {DomUtils} from "../../../domParsers/domUtils";

import {ExtensionUtils} from "../../../extensions/extensionUtils";

import {Localization} from "../../../localization/localization";

import {ClipperStateProp, DataResult} from "../../clipperState";
import {Status} from "../../status";

import {RotatingMessageSpriteAnimation} from "../../components/rotatingMessageSpriteAnimation";

import {PdfPreviewAttachment} from "./pdfPreviewAttachment";
import {PdfPreviewPage} from "./pdfPreviewPage";
import {PreviewComponentBase} from "./previewComponentBase";
import { PreviewViewerPdfHeader } from "./previewViewerPdfHeader";
import {PreviewViewerPdfHeader2} from "./previewViewerPdfHeader2";


import * as _ from "lodash";

type IndexToDataUrlMap = { [index: number]: string; }

interface PdfPreviewState {
	showPageNumbers?: boolean;
	invalidRange?: boolean;
	renderedPageIndexes?: IndexToDataUrlMap;
}

class PdfPreviewClass extends PreviewComponentBase<PdfPreviewState, ClipperStateProp> {
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
			renderedPageIndexes: {},
			invalidRange: false
		};
	}

	private searchForVisiblePageBoundary(allPages: NodeListOf<Element>, initPageIndex: number, incrementer: number): number {
		let pageIndexToTest = initPageIndex;
		let guessAtPageBoundary = allPages[pageIndexToTest] as HTMLDivElement;

		while (guessAtPageBoundary && this.pageIsVisible(guessAtPageBoundary)) {
			pageIndexToTest += incrementer;
			guessAtPageBoundary = allPages[pageIndexToTest] as HTMLDivElement;
		}

		// result of adding last incrementer was a non-visible page, so return the page num from before that
		return Math.max(pageIndexToTest -= incrementer, 0);
	}

	/**
	 * Get an approximation of the centermost visible page currently in the viewport (based on scroll percentage).
	 * If the page is indeed in the viewport, search up and down for the visible page boundaries.
	 * If the page approximation was incorrect and the page is not visible, begin a fan-out search of the area around the approximate page
	 * for a visible page. When a visible page boundary is found, find the other visible page boundary.
	 */
	private getIndicesOfVisiblePages(): number[] {
		let allPages = document.querySelectorAll("div[data-pageindex]");

		const initGuessAtCurrentPageIndexer: number = Math.floor(DomUtils.getScrollPercent(document.getElementById("previewContentContainer"), true /* asDecimalValue */) * (allPages.length - 1));

		let firstVisiblePageIndexer: number;
		let lastVisiblePageIndexer: number;
		if (this.pageIsVisible(allPages[initGuessAtCurrentPageIndexer] as HTMLDivElement)) {
			firstVisiblePageIndexer = this.searchForVisiblePageBoundary(allPages, initGuessAtCurrentPageIndexer, -1);
			lastVisiblePageIndexer = this.searchForVisiblePageBoundary(allPages, initGuessAtCurrentPageIndexer, 1);
		} else {
			let incrementer = 1;
			let guessAtVisiblePageIndexer = initGuessAtCurrentPageIndexer + incrementer;
			let guessAtVisiblePageBoundary = allPages[guessAtVisiblePageIndexer] as HTMLDivElement;

			while (!this.pageIsVisible(guessAtVisiblePageBoundary)) {
				if (incrementer > 0) {
					incrementer *= -1;
				} else {
					incrementer = (incrementer * -1) + 1;
				}

				guessAtVisiblePageIndexer = initGuessAtCurrentPageIndexer + incrementer;

				guessAtVisiblePageBoundary = allPages[guessAtVisiblePageIndexer] as HTMLDivElement;
			}

			if (incrementer > 0) {
				firstVisiblePageIndexer = guessAtVisiblePageIndexer;
				lastVisiblePageIndexer = this.searchForVisiblePageBoundary(allPages, firstVisiblePageIndexer, 1);
			} else {
				lastVisiblePageIndexer = guessAtVisiblePageIndexer;
				firstVisiblePageIndexer = this.searchForVisiblePageBoundary(allPages, lastVisiblePageIndexer, -1);
			}
		}

		// _.range does not include the end number, so add 1
		return _.range(firstVisiblePageIndexer, lastVisiblePageIndexer + 1);
	}

	private setDataUrlsOfImagesInViewportInState() {
		let pageIndicesToRender: number[] = this.getIndicesOfVisiblePages();

		// Pad pages to each end of the list to increase the scroll distance before the user hits a blank page
		if (pageIndicesToRender.length > 0) {
			let first = pageIndicesToRender[0];
			let extraPagesToPrepend = _.range(Math.max(first - Constants.Settings.pdfExtraPageLoadEachSide, 0), first);

			let afterLast = pageIndicesToRender[pageIndicesToRender.length - 1] + 1;
			let extraPagesToAppend = _.range(afterLast, Math.min(afterLast + Constants.Settings.pdfExtraPageLoadEachSide, this.props.clipperState.pdfResult.data.get().pdf.numPages()));

			pageIndicesToRender = extraPagesToPrepend.concat(pageIndicesToRender).concat(extraPagesToAppend);
		}

		this.setDataUrlsOfImagesInState(pageIndicesToRender);
	}

	private pageIsVisible(element: HTMLElement): boolean {
		if (!element) {
			return false;
		}

		let rect = element.getBoundingClientRect();
		return rect.top <= window.innerHeight && rect.bottom >= 0;
	}

	private setDataUrlsOfImagesInState(pageIndicesToRender: number[]) {
		this.props.clipperState.pdfResult.data.get().pdf.getPageListAsDataUrls(pageIndicesToRender).then((dataUrls) => {
			let renderedIndexes: IndexToDataUrlMap = {};
			for (let i = 0; i < dataUrls.length; i++) {
				renderedIndexes[pageIndicesToRender[i]] = dataUrls[i];
			}
			this.setState({
				renderedPageIndexes: renderedIndexes
			});
		});
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

		for (let i = 0; i < pdfResult.pdf.numPages(); i++) {
			pages.push(<PdfPreviewPage showPageNumber={this.state.showPageNumbers} isSelected={this.props.clipperState.pdfPreviewInfo.allPages || pagesToShow.indexOf(i) >= 0}
				viewportDimensions={pdfResult.viewportDimensions[i]} imgUrl={this.state.renderedPageIndexes[i]} index={i} />);
		}
		return pages;
	}

	private addScrollListener() {
		if (PdfPreviewClass.latestScrollListener) {
			window.removeEventListener("scroll", PdfPreviewClass.latestScrollListener, true);
		}
		// When we detect a scroll, show page numbers immediately.
		// When the user doesn't scroll for some period of time, fade them out.
		PdfPreviewClass.latestScrollListener = (event) => {
			let element = event.target as HTMLElement;
			if (!!element && element.id === Constants.Ids.previewContentContainer) {
				if (ObjectUtils.isNumeric(PdfPreviewClass.scrollListenerTimeout)) {
					clearTimeout(PdfPreviewClass.scrollListenerTimeout);
				}
				PdfPreviewClass.scrollListenerTimeout = setTimeout(() => {
					this.setState({
						showPageNumbers: false
					});
					// We piggyback the scroll listener to determine what pages the user is looking at, then render them
					if (this.props.clipperState.pdfResult.status === Status.Succeeded) {
						this.setDataUrlsOfImagesInViewportInState();
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
		window.addEventListener("scroll", PdfPreviewClass.latestScrollListener, true /* allows the listener to listen to all elements */);
	}

	protected getContentBodyForCurrentStatus(): any[] {
		let state = this.props.clipperState;
		if (state.pdfResult.status === Status.InProgress || state.pdfResult.status === Status.NotStarted) {
			return [this.getSpinner()];
		}

		return this.convertPdfResultToContentData(state.pdfResult);
	}

	onSelectionChange(selection: boolean) {
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			allPages: selection
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	onTextChange(text: string) {
		console.log("old onTextChange");
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			selectedPageRange: text
		} as PdfPreviewInfo), this.props.clipperState.setState);

		let pagesToShow = StringUtils.parsePageRange(text);
		let validUpperBounds = _.every(pagesToShow, (ind: number) => {
			return ind <= this.props.clipperState.pdfResult.data.get().pdf.numPages();
		});

		if (!pagesToShow || !validUpperBounds) {
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
		_.assign(_.extend(this.props.clipperState.pdfPreviewInfo, {
			shouldAttachPdf: checked
		} as PdfPreviewInfo), this.props.clipperState.setState);
	}

	protected getHeader(): any {
		return <PreviewViewerPdfHeader2 dummy />;
		// return <PreviewViewerPdfHeader
		// 	invalidRange={this.state.invalidRange}
		// 	shouldAttachPdf={this.props.clipperState.pdfPreviewInfo.shouldAttachPdf}
		// 	allPages={this.props.clipperState.pdfPreviewInfo.allPages}
		// 	onCheckboxChange={this.onCheckboxChange.bind(this)}
		// 	onSelectionChange={this.onSelectionChange.bind(this)}
		// 	onTextChange={this.onTextChange.bind(this)}
		// 	clipperState={this.props.clipperState} />;
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
					// Load the first n pages (or fewer if numPages < n) as soon as we are able to
					this.initPageRenderCalled = true;
					this.setDataUrlsOfImagesInState(_.range(Math.min(Constants.Settings.pdfInitialPageLoadCount, result.data.get().pdf.numPages())));
				}

				// In OneNote we don't display the extension
				let shouldAttachPdf = this.props.clipperState.pdfPreviewInfo.shouldAttachPdf;
				let defaultAttachmentName = "Original.pdf";
				let fullAttachmentName = this.props.clipperState.pageInfo ? UrlUtils.getFileNameFromUrl(this.props.clipperState.pageInfo.rawUrl, defaultAttachmentName) : defaultAttachmentName;
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
			spriteUrl={ExtensionUtils.getImageResourceUrl("spinner_loop_colored.png") }
			imageHeight={65}
			imageWidth={45}
			totalFrameCount={21}
			loop={true}
			shouldDisplayMessage={false} />;
		return <div className={Constants.Classes.centeredInPreview}>{spinner}</div>;
	}
}

let component = PdfPreviewClass.componentize();
export {component as PdfPreview};
