import {ComponentBase} from "../componentBase";
import {ClipperStateProp} from "../clipperState";

class RenderMe extends ComponentBase<{}, ClipperStateProp> {
	render() {
		return(
			<div> Hello!! </div>
		);
	}
}

let component = RenderMe.componentize();
export { component as RenderMe };
