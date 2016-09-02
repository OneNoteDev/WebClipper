// No removeKey for now, since we don't use it
export interface StorageAsync {
	getValue(key: string, callback: (value: string) => void): void;
	setValue(key: string, value: string, callback?: (value: string) => void): void;
}
