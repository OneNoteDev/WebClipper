export interface StorageGateStrategy {
	shouldSet(key: string, value: string): Promise<boolean>;
}
