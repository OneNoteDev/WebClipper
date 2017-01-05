export class ArrayUtils {
	/**
	 * Given a specified number of items, returns a array of bucket counts where buckets
	 * are as evenly divided as possible, and every bucket contains no more than maxPerBucket
	 * items.
	 */
	public static createEvenBuckets(numItems: number, maxPerBucket: number): number[] {
		if (numItems < 1) {
			return [];
		}

		if (maxPerBucket < 1) {
			throw new Error("maxPerBucket cannot be less than 1 but was: " + maxPerBucket);
		}

		if (numItems <= maxPerBucket) {
			return [numItems];
		}

		// Calculate the smallest divisor where the largest bucket is size <= maxPerBucket
		let divisor = Math.ceil(numItems / maxPerBucket);
		let integerDivideResult = Math.floor(numItems / divisor);
		let remainder = numItems % divisor;

		let bucketCounts: number[] = [];
		for (let i = 0; i < divisor; i++) {
			// If there is a remainder, we need to distribute the extra items among the first few buckets
			bucketCounts.push(integerDivideResult + (i < remainder ? 1 : 0));
		}
		return bucketCounts;
	}

	/**
	 * Given an array of items, bucket them into partitions where buckets are as evenly
	 * divided as possible, and every bucket contains no more than maxPerBucket items.
	 * Also retains the ordering of the items when partitions are flattened.
	 */
	public static partition(items: any[], maxPerBucket: number): any[][] {
		if (items.length === 0) {
			return [];
		}

		let bucketCounts = ArrayUtils.createEvenBuckets(items.length, maxPerBucket);
		let partitions: any[][] = [];
		let sliceStart = 0;
		for (let i = 0; i < bucketCounts.length; i++) {
			let sliceEnd = sliceStart + bucketCounts[i];
			partitions.push(items.slice(sliceStart, sliceEnd));
			sliceStart = sliceEnd;
		}
		return partitions;
	}

	/**
	 * Given an array, returns true if all items are defined; false otherwise.
	 */
	public static isArrayComplete(arr: any[]): boolean {
		for (let i = 0; i < arr.length; i++) {
			if (!arr[i]) {
				return false;
			}
		}
		return true;
	}
}
