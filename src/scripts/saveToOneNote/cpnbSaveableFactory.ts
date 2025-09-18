import { UrlUtils } from "../urlUtils";
import { ClipperState } from "../clipperUI/clipperState";
import { SaveToCpnb } from "./saveToCpnb";

export class CpnbSaveableFactory {
  private clipperState: ClipperState;

  constructor(clipperState: ClipperState) {
    this.clipperState = clipperState;
  }

  public savePdfToCpnb(): Promise<Response> {
    const pdfResult = this.clipperState.pdfResult.data.get();
    if (!pdfResult || !pdfResult.pdf) {
      return Promise.reject(new Error("No PDF data available"));
    }
    return pdfResult.pdf.getData().then((buffer: ArrayBuffer) => {
      const fileName = UrlUtils.getFileNameFromUrl(this.clipperState.pageInfo.rawUrl, "Original.pdf");
      const cpnb = new SaveToCpnb();
      return cpnb.save({ pdfBuffer: buffer, fileName });
    });
  }
}
