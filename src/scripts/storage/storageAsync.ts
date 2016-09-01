export interface StorageAsync {
	getValue(key: string, callback: (value: string) => void): void;
	setValue(key: string, value: string, callback?: (value: string) => void): void;
	removeKey(key: string, callback?: (successful: boolean) => void): void;
}
