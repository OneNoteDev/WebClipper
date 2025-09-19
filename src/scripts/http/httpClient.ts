import {WorkspaceService} from '../services/workspaceService';

export class HttpClient {
    async get<T = any>(url: string, headers: Record<string, string> = {}): Promise<T> {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                ...headers
            }
        });
        if (!response.ok) {
            throw new Error(`GET request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async post<T = any>(url: string, data: any, headers: Record<string, string> = {}): Promise<T> {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`POST request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}

// Example usage using the shared WorkspaceService
const run = async () => {
    try {
        const workspaces = await WorkspaceService.fetchWorkspaces();
        console.log('Workspaces:', workspaces);
    } catch (error) {
        console.error('Failed to fetch workspaces:', error);
    }
};

run();
