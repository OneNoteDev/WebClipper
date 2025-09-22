import * as jwtDecode from 'jwt-decode';
import { HttpClient } from '../http/httpClient';

export class WorkspaceService {
	private static token = "";
	private static graphToken = ""; // Set this to your Microsoft Graph token as needed
	private static sharePointToken = ""; // Set this to your SharePoint token as needed
	private static microsoftToken = ""; // Set this to your Microsoft token as needed

	static validateToken(token: string): boolean {
		try {
			const decodedToken: { exp: number } = jwtDecode(token);
			const expirationDate = new Date(decodedToken.exp * 1000);

			if (expirationDate.getTime() < Date.now()) {
				return false;
			}
			return true;
		} catch (error) {
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

			const response = await httpClient.get(url, {
				"Authorization": `Bearer ${this.token}`
			});

			if (response && response.workspaces) {
				const workspaceTitles = response.workspaces.map((workspace: any) => workspace.title);
				return workspaceTitles;
			}
			return [];
		} catch (error) {
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
            return null;
        }
	}	/**
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
		const url = `https://microsoftapc-my.sharepoint.com/_api/v2.0/drives/${driveId}/items/root:/Microsoft%20Copilot%20Chat%20Files/Copilot%20Notebook%20Uploads/${encodedFilename}.pdf:/content?%40name.conflictBehavior=rename`;
		
		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					"Authorization": `Bearer ${WorkspaceService.sharePointToken}`,
					"Content-Type": "application/pdf"
				},
				body: pdfBuffer
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`SharePoint upload failed: ${response.status} ${response.statusText}`);
			}
			
			let responseData;
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.indexOf('application/json') !== -1) {
				responseData = await response.json();
			} else {
				responseData = await response.text();
			}
			
			if (responseData && typeof responseData === 'object' && responseData.id) {
				return responseData.id as string;
			}
			
			return null;
			
		} catch (error) {
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
		const url = `https://microsoftapc-my.sharepoint.com/_api/v2.1/drives/${driveId}/items/${itemId}/createLink`;
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
			return null;
		}
	}


}