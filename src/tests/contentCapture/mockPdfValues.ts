import {pdfDataUrls} from "../clipperUI/components/previewViewer/pdfDataUrls";

export class MockPdfValues {
	public static pageDataUrls = pdfDataUrls;
	public static pageDataUrlsMap = {
		0: pdfDataUrls[0],
		1: pdfDataUrls[1],
		2: pdfDataUrls[2]
	};

	public static dimensions = [{
		width: 1, height: 1
	}, {
		width: 2, height: 2
	}, {
		width: 3, height: 3
	}];

	public static byteLength = 5;
	public static data = new Uint8Array([10, 20, 30]);
}
