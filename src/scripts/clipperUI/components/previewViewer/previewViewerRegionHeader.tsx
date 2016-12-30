// import {Constants} from "../../../constants";

// import {ExtensionUtils} from "../../../extensions/extensionUtils";

// import {Localization} from "../../../localization/localization";

// import {ClipperStateProp} from "../../clipperState";
// import {Status} from "../../status";

// import {ControlGroup, HeaderClasses, PreviewViewerHeaderComponentBase} from "./previewViewerHeaderComponentBase";

// class PreviewViewerRegionHeaderClass extends PreviewViewerHeaderComponentBase<{}, ClipperStateProp> {
// 	addAnotherRegion() {
// 		this.props.clipperState.setState({
// 			regionResult: {
// 				status: Status.InProgress,
// 				data: this.props.clipperState.regionResult.data
// 			}
// 		});
// 	}

// 	getControlGroups(): ControlGroup[] {
// 		return [this.getAddRegionGroup()];
// 	}

// 	private getAddRegionGroup(): ControlGroup {
// 		return {
// 			id: Constants.Ids.addRegionControl,
// 			innerElements: [
// 				<button
// 					id={Constants.Ids.addAnotherRegionButton}
// 					{...this.enableInvoke(this.addAnotherRegion.bind(this), 100) }
// 					className={HeaderClasses.Button.controlButton}
// 					style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular) }
// 					type="button">
// 					<img src={ExtensionUtils.getImageResourceUrl("editorOptions/add_icon.png")} />
// 					<span>{Localization.getLocalizedString("WebClipper.Preview.Header.AddAnotherRegionButtonLabel")}</span>
// 				</button>
// 			]
// 		};
// 	}
// }

// let component = PreviewViewerRegionHeaderClass.componentize();
// export {component as PreviewViewerRegionHeader};
