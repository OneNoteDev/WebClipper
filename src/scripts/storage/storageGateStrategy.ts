export interface StorageGateStrategy {
	shouldSet(key: string, value: string, callback: (shouldSet: boolean) => void): void;
}
