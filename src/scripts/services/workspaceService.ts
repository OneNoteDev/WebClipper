import * as jwtDecode from 'jwt-decode';
import { HttpClient } from '../http/httpClient';

export class WorkspaceService {
	private static token = "SUBSTRATE_TOKEN_HERE";
	private static apiUrl = "https://substrate.office.com/recommended/api/v1.1/loop/recent?top=3&settings=true&rs=en-us&workspaceUsageTypes=Copilot,CopilotNotebook";

	static validateToken(): boolean {
		try {
			const decodedToken: { exp: number } = jwtDecode(this.token);
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
			if (!this.validateToken()) {
				return [];
			}

			const httpClient = new HttpClient();
			console.log("Fetching workspaces from:", this.apiUrl);
			
			const response = await httpClient.get(this.apiUrl, {
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
}