export module ArrayUtils {
	/**
	 * Given a specified number of items, returns a array of bucket counts where buckets
	 * are as evenly divided as possible, and every bucket contains no more than maxPerBucket
	 * items.
	 */
	export function createEvenBuckets(numItems: number, maxPerBucket: number): number[] {
		if (numItems <= maxPerBucket) {
			return [numItems];
		}

		// Calculate the smallest divisor where the largest bucket is size <= maxPerBucket
		let divisor = 2;
		let integerDivideResult: number;
		let remainder: number;
		while (true) {
			integerDivideResult = Math.floor(numItems / divisor);
			remainder = numItems % divisor;
			if (integerDivideResult + (remainder === 0 ? 0 : 1) <= maxPerBucket) {
				break;
			}
			divisor++;
		}

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
	export function partition(items: any[], maxPerBucket: number): any[][] {
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

	// We have to use this instead of Array.prototype.every because it doesn't work
	export function isArrayComplete(arr: any[]): boolean {
		for (let i = 0; i < arr.length; i++) {
			if (!arr[i]) {
				return false;
			}
		}
		return true;
	}
}
