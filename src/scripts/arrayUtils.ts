export module ArrayUtils {
	/**
	 * Given a specified number of items, returns a list of bucket counts where buckets
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
			bucketCounts.push(integerDivideResult + (i < remainder ? 1 : 0));
		}
		return bucketCounts;
	}
}
