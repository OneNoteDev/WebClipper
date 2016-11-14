import {Constants} from "../../constants";

import {ExtensionUtils} from "../../extensions/extensionUtils";

import {Localization} from "../../localization/localization";

import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";
import {Status} from "../status";

import {SpriteAnimation} from "../components/spriteAnimation";

class LoadingPanelClass extends ComponentBase<{ }, ClipperStateProp> {
	render() {
		return (
			<div id={Constants.Ids.clipperLoadingContainer} className="progressPadding">
				<SpriteAnimation spriteUrl={ExtensionUtils.getImageResourceUrl("spinner_loop.png")} imageHeight={32} totalFrameCount={21} loop={true}/>
			</div>
		);
	}
}

let component = LoadingPanelClass.componentize();
export {component as LoadingPanel};
