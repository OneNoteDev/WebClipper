import {ArrayUtils} from "../scripts/arrayUtils";

import {TestModule} from "./testModule";

export class ArrayUtilsTests extends TestModule {
	protected module() {
		return "arrayUtils";
	}

	protected tests() {
		test("createEvenBuckets should return identical buckets when numItems % maxPerBucket = 0", () => {
			deepEqual(ArrayUtils.createEvenBuckets(20, 5), [5, 5, 5, 5]);
		});

		test("createEvenBuckets should return identical buckets, with the exception of the first numItems % maxPerBucket buckets when numItems % maxPerBucket > 0", () => {
			deepEqual(ArrayUtils.createEvenBuckets(23, 5), [5, 5, 5, 4, 4]);
		});

		test("createEvenBuckets should return a single bucket of numItems if numItems < maxPerBucket", () => {
			deepEqual(ArrayUtils.createEvenBuckets(5, 10), [5]);
		});

		test("createEvenBuckets should return numItem buckets of 1 if maxPerBucket = 1", () => {
			deepEqual(ArrayUtils.createEvenBuckets(5, 1), [1, 1, 1, 1, 1]);
		});

		test("createEvenBuckets should return a single bucket of 1 if numItems = 1", () => {
			deepEqual(ArrayUtils.createEvenBuckets(1, 5), [1]);
		});

		test("createEvenBuckets should return a single bucket of numItems if numItems = maxPerBucket", () => {
			deepEqual(ArrayUtils.createEvenBuckets(100, 100), [100]);
			deepEqual(ArrayUtils.createEvenBuckets(1, 1), [1]);
		});

		test("createEvenBuckets should return a single bucket of items if numItems = maxPerBucket", () => {
			deepEqual(ArrayUtils.partition(["x", "y", "z"], 3), [["x", "y", "z"]]);
			deepEqual(ArrayUtils.partition(["x"], 1), [["x"]]);
		});

		test("createEvenBuckets should return an empty list when numItems is 0", () => {
			deepEqual(ArrayUtils.createEvenBuckets(0, 5), []);
		});

		test("createEvenBuckets should throw an exception when maxBuckets is 0", () => {
			throws(() => {
				deepEqual(ArrayUtils.createEvenBuckets(5, 0), []);
			}, "maxPerBucket cannot be less than 1 but was: 0");
		});

		test("partition should bucket items evenly and in order when numItems % maxBucket = 0", () => {
			deepEqual(ArrayUtils.partition(["Apples", "Oranges", "Bananas", "Kiwifruit"], 2), [["Apples", "Oranges"], ["Bananas", "Kiwifruit"]]);
		});

		test("partition should bucket items as evenly as possible in order when numItems % maxBucket > 0", () => {
			deepEqual(ArrayUtils.partition(["Puppers", "Doggos", "Yappers", "Woofers", "Trash Pandas"], 2), [["Puppers", "Doggos"], ["Yappers", "Woofers"], ["Trash Pandas"]]);
		});

		test("partition should return a single bucket of items if numItems < maxPerBucket", () => {
			deepEqual(ArrayUtils.partition([1, 2, 3, 4, 5], 10), [[1, 2, 3, 4, 5]]);
		});

		test("partition should return numItem buckets of 1 if maxPerBucket = 1", () => {
			deepEqual(ArrayUtils.partition([1, 2, 3, 4, 5], 1), [[1], [2], [3], [4], [5]]);
		});

		test("partition should return a single bucket of that item if numItems = 1", () => {
			deepEqual(ArrayUtils.partition(["x"], 5), [["x"]]);
		});

		test("partition should return an empty list when items is 0", () => {
			deepEqual(ArrayUtils.partition([], 2), []);
		});
	}
}

(new ArrayUtilsTests()).runTests();
