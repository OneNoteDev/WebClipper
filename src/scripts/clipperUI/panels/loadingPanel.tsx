import {Constants} from "../../constants";
import {ExtensionUtils} from "../../extensions/extensionUtils";
import {ClipperStateProp} from "../clipperState";
import {ComponentBase} from "../componentBase";

import {SpriteAnimation} from "../components/spriteAnimation";

class LoadingPanelClass extends ComponentBase<{ }, ClipperStateProp> {
	render() {
		return (
			<div id={Constants.Ids.clipperLoadingContainer} className="progressPadding">
				<SpriteAnimation
					spriteUrl={ExtensionUtils.getImageResourceUrl("spinner_loop.png")}
					imageHeight={32}
					totalFrameCount={21}
					loop={true}
					shouldTakeFocus={true} />
			</div>
		);
	}
}

let component = LoadingPanelClass.componentize();
export {component as LoadingPanel};
