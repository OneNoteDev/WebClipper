// src/scripts/http/httpClient.ts
// A simple HTTP client for GET and POST requests returning JSON

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
