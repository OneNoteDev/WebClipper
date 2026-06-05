export namespace OneNoteApi {
	export enum RequestErrorType {
		NETWORK_ERROR,
		UNEXPECTED_RESPONSE_STATUS,
		REQUEST_TIMED_OUT,
		UNABLE_TO_PARSE_RESPONSE
	}

	export enum ContentType {
		Html = 0,
		Image = 1,
		EnhancedUrl = 2,
		Url = 3,
		Onml = 4
	}

	export interface GenericError {
		error: string;
	}

	export interface RequestError extends GenericError {
		timeout?: number;
		statusCode: number;
		response: string;
		responseHeaders: { [key: string]: string };
	}
}
