// SaveToCpnb.ts
// Dummy service to send PDF data to a CPNB endpoint

export interface SaveToCpnbOptions {
  pdfBuffer: ArrayBuffer;
  fileName: string;
}

export class SaveToCpnb {
  private endpoint: string = "https://dummy-cpnb-endpoint.example.com/api/upload";

  public save(options: SaveToCpnbOptions): Promise<Response> {
    const formData = new FormData();
    formData.append("file", new Blob([options.pdfBuffer], { type: "application/pdf" }), options.fileName);
    return fetch(this.endpoint, {
      method: "POST",
      body: formData
    });
  }
}
