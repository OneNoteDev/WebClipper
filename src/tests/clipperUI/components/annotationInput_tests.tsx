import {Constants} from "../../../scripts/constants";

import {AnnotationInput} from "../../../scripts/clipperUI/components/annotationInput";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

export class AnnotationInputTests extends TestModule {
	private defaultComponent;

	protected module() {
		return "annotationInput";
	}

	protected beforeEach() {
		this.defaultComponent =
			<AnnotationInput clipperState={ MockProps.getMockClipperState() } />;
	}

	protected tests() {
		test("The annotation container should always have 2 elements", () => {
			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let annotationContainer = MithrilUtils.getFixture().firstElementChild as HTMLElement;
			let annotationContainerChildren = annotationContainer.children;

			strictEqual(annotationContainerChildren.length, 2,
				"The annotation container should contain two children");
			strictEqual(annotationContainerChildren[0].id, Constants.Ids.annotationFieldMirror,
				"The first child of the annotation container should be the annotation field mirror");
			strictEqual(annotationContainerChildren[1].id, Constants.Ids.annotationField,
				"The second child of the annotation container should be the annotation field");
		});
	}
}

(new AnnotationInputTests()).runTests();
