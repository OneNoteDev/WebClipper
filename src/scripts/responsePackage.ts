export interface ResponsePackage<T> {
	parsedResponse: T;
	request: XMLHttpRequest;
}
