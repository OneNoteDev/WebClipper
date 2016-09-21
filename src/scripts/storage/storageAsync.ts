// No removeKey for now, since we don't use it
export interface StorageAsync {
	getCachedValue(key: string): string;
	getValue(key: string, callback: (value: string) => void, cacheValue?: boolean): void;
	getValues(keys: string[], callback: (values: {}) => void, cacheValue?: boolean): void;
	setValue(key: string, value: string, callback?: (value: string) => void): void;
}
