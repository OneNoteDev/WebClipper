// import {Localization} from "../../../localization/localization";

// import {ClipperStateProp, DataResult} from "../../clipperState";
// import {Status} from "../../status";

// import {RegionSelection} from "../../components/regionSelection";

// import {PreviewComponentBase} from "./previewComponentBase";
// import {PreviewViewerRegionHeader} from "./previewViewerRegionHeader";
// import {PreviewViewerRegionTitleOnlyHeader} from "./previewViewerRegionTitleOnlyHeader";

// class RegionPreview extends PreviewComponentBase<{}, ClipperStateProp> {
// 	protected getContentBodyForCurrentStatus(): any[] {
// 		return this.convertRegionResultToContentData(this.props.clipperState.regionResult);
// 	}

// 	protected getHeader() {
// 		if (this.props.clipperState.injectOptions.enableRegionClipping) {
// 			return <PreviewViewerRegionHeader
// 				clipperState={this.props.clipperState} />;
// 		}
// 		// This mode is made possible through image-selection clipping on supporting browsers
// 		return <PreviewViewerRegionTitleOnlyHeader clipperState={this.props.clipperState} />;
// 	}

// 	protected getStatus(): Status {
// 		return this.props.clipperState.regionResult.status;
// 	}

// 	// TODO can't we just return the title text?
// 	protected getTitleTextForCurrentStatus(): string {
// 		let noContentFoundString = Localization.getLocalizedString("WebClipper.Preview.NoContentFound");

// 		let previewStatus = this.getStatus();

// 		switch (previewStatus) {
// 			case Status.Succeeded:
// 				return this.props.clipperState.previewGlobalInfo.previewTitleText;
// 			case Status.NotStarted:
// 			case Status.InProgress:
// 				return Localization.getLocalizedString("WebClipper.Preview.LoadingMessage");
// 			default:
// 			case Status.Failed:
// 				return noContentFoundString;
// 		}
// 	}

// 	private convertRegionResultToContentData(result: DataResult<string[]>): any[] {
// 		let contentBody = [];

// 		switch (result.status) {
// 			case Status.Succeeded:
// 				let regions = this.props.clipperState.regionResult.data;

// 				// We want to disallow removal of regions in image-selection mode where the browser does not support the screenshot API
// 				let onRemove = this.props.clipperState.injectOptions && this.props.clipperState.injectOptions.enableRegionClipping ?
// 					(index: number) => {
// 						let newRegions = this.props.clipperState.regionResult.data;
// 						newRegions.splice(index, 1);
// 						if (newRegions.length === 0) {
// 							this.props.clipperState.setState({ regionResult: { status: Status.NotStarted, data: newRegions } });
// 						} else {
// 							this.props.clipperState.setState({ regionResult: { status: Status.Succeeded, data: newRegions } });
// 						}
// 					} : undefined;

// 				for (let i = 0; i < regions.length; i++) {
// 					contentBody.push(<RegionSelection index={i} imageSrc={regions[i]} onRemove={onRemove} />);
// 				}
// 				break;
// 			default:
// 			case Status.NotStarted:
// 			case Status.InProgress:
// 			case Status.Failed:
// 				break;
// 		}

// 		return contentBody;
// 	}
// }

// let component = RegionPreview.componentize();
// export {component as RegionPreview};
