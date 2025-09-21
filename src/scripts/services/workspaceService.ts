import * as jwtDecode from 'jwt-decode';
import { HttpClient } from '../http/httpClient';

export class WorkspaceService {
	private static token = "<token>";
	private static graphToken = ""; // Set this to your Microsoft Graph token as needed
	private static sharePointToken = ""; // Set this to your SharePoint token as needed
	private static microsoftToken = ""; // Set this to your Microsoft token as needed

	static validateToken(token: string): boolean {
		try {
			const decodedToken: { exp: number } = jwtDecode(token);
			const expirationDate = new Date(decodedToken.exp * 1000);
			console.log(`Token expires on: ${expirationDate.toUTCString()}`);

			if (expirationDate.getTime() < Date.now()) {
				console.error("Token has expired. Please provide a new token.");
				return false;
			}
			return true;
		} catch (error) {
			console.error("Failed to decode token:", error);
			return false;
		}
	}

	static async fetchWorkspaces(): Promise<string[]> {
		try {
			if (!this.validateToken(this.token)) {
				return [];
			}

			const url = "https://substrate.office.com/recommended/api/v1.1/loop/recent?top=3&settings=true&rs=en-us&workspaceUsageTypes=Copilot,CopilotNotebook";
			const httpClient = new HttpClient();
			console.log("Fetching workspaces from:", url);

			const response = await httpClient.get(url, {
				"Authorization": `Bearer ${this.token}`
			});

			console.log("Workspace API response:", response);

			if (response && response.workspaces) {
				const workspaceTitles = response.workspaces.map((workspace: any) => workspace.title);
				console.log("Extracted workspace titles:", workspaceTitles);
				return workspaceTitles;
			}
			console.log("No workspaces found in response");
			return [];
		} catch (error) {
			console.error("Failed to fetch workspaces:", error);
			return [];
		}
	}

	// Fetches the user's drive id from Microsoft Graph
    static async fetchDriveId(): Promise<string | null> {
        if (!this.graphToken || !this.validateToken(this.graphToken)) {
            return null;
        }
        const url = "https://graph.microsoft.com/v1.0/me/drive?select=owner,id,sharepointIds";
        try {
            const httpClient = new HttpClient();
            const response = await httpClient.get(url, {
                "Authorization": `Bearer ${this.graphToken}`
            });
            if (response && response.id) {
                return response.id;
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch drive id:", error);
            return null;
        }
	}
	
	/**
	 * Uploads a PDF file to SharePoint and returns the fileReferenceId (the uploaded file's id).
	 * @param driveId The drive id to upload to.
	 * @param filename The name of the PDF file (without extension).
	 * @param pdfBuffer The PDF file as an ArrayBuffer, Blob, or Uint8Array.
	 * @returns fileReferenceId as string, or null if upload fails.
	 */

	static async SharePointUpload(driveId: string, filename: string, pdfBuffer: ArrayBuffer | Blob | Uint8Array): Promise<string | null> {
		if (!WorkspaceService.sharePointToken || !WorkspaceService.validateToken(WorkspaceService.sharePointToken)) {
			return null;
		}
		const encodedFilename = encodeURIComponent(filename);
		const url = `https://microsoft-my.sharepoint.com/_api/v2.0/drives/${driveId}/items/root:/Microsoft%20Copilot%20Chat%20Files/Copilot%20Notebook%20Uploads/${encodedFilename}.pdf:/content?%40name.conflictBehavior=rename`;
		try {
			const httpClient = new HttpClient();
			const response = await httpClient.post(url, pdfBuffer, {
				"Authorization": `Bearer ${WorkspaceService.sharePointToken}`,
				"Content-Type": "application/pdf"
			});
			if (response && response.id) {
				return response.id as string; // fileReferenceId
			}
			return null;
		} catch (error) {
			console.error("Failed to upload PDF to SharePoint:", error);
			return null;
		}
	}

	private static createLinkPayload = { role: "edit", scope: "organization" };

	/**
	 * Creates a sharing link for a file in SharePoint using the microsoftToken.
	 * @param driveId The drive id.
	 * @param itemId The item id (file id).
	 * @returns The API response, or null if failed.
	 */
	static async createLink(driveId: string, itemId: string): Promise<string | null> {
		if (!WorkspaceService.microsoftToken || !WorkspaceService.validateToken(WorkspaceService.microsoftToken)) {
			return null;
		}
		const url = `https://microsoft-my.sharepoint.com/_api/v2.1/drives/${driveId}/items/${itemId}/createLink`;
		try {
			const httpClient = new HttpClient();
			const response = await httpClient.post(url, WorkspaceService.createLinkPayload, {
				"Authorization": `Bearer ${WorkspaceService.microsoftToken}`,
				"Content-Type": "application/json"
			});
			if (response && response.link && typeof response.link.webUrl === "string") {
				return response.link.webUrl;
			}
			return null;
		} catch (error) {
			console.error("Failed to create sharing link:", error);
			return null;
		}
	}


}