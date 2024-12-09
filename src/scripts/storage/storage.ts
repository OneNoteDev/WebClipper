export interface Storage {
	getValue(key: string): Promise<string>;
	getValues(keys: string[]): Promise<{}>;
	setValue(key: string, value: string): Promise<void>;
	removeKey(key: string): boolean;
}
