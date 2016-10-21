import {ArrayUtils} from "../scripts/arrayUtils";

QUnit.module("arrayUtils", {});

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
