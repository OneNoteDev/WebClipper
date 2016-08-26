import {Version} from "../../scripts/versioning/version";

QUnit.module("version", {});

test("The constructor should throw an error if the parameter does not follow 'int.int.int'", () => {
	throws(() => {
		let version = new Version("abcd");
	}, Error("version must match 'int.int.int' pattern, but was: abcd"));

	throws(() => {
		let version = new Version("3123");
	}, Error("version must match 'int.int.int' pattern, but was: 3123"));

	throws(() => {
		let version = new Version("3.1.0.");
	}, Error("version must match 'int.int.int' pattern, but was: 3.1.0."));

	throws(() => {
		let version = new Version(".3.1.0");
	}, Error("version must match 'int.int.int' pattern, but was: .3.1.0"));

	throws(() => {
		let version = new Version("3..0");
	}, Error("version must match 'int.int.int' pattern, but was: 3..0"));

	throws(() => {
		let version = new Version("3.0");
	}, Error("version must match 'int.int.int' pattern, but was: 3.0"));

	throws(() => {
		let version = new Version("3.0.a");
	}, Error("version must match 'int.int.int' pattern, but was: 3.0.a"));

	throws(() => {
		let version = new Version("3.1.0 ");
	}, Error("version must match 'int.int.int' pattern, but was: 3.1.0 "));

	throws(() => {
		let version = new Version(" 3.1.0");
	}, Error("version must match 'int.int.int' pattern, but was:  3.1.0"));

	throws(() => {
		let version = new Version("");
	}, Error("version must match 'int.int.int' pattern, but was: "));

	throws(() => {
		let version = new Version(undefined);
	}, Error("version must match 'int.int.int' pattern, but was: undefined"));

	/* tslint:disable:no-null-keyword */
	throws(() => {
		let version = new Version(null);
	}, Error("version must match 'int.int.int' pattern, but was: null"));
	/* tslint:enable:no-null-keyword */
});

test("Test comparison methods where both versions are instantiated with the same parameters", () => {
	let v1 = new Version("1.2.3");
	let v2 = new Version("1.2.3");

	ok(v1.isEqualTo(v2));
	ok(!v1.isGreaterThan(v2));
	ok(v1.isGreaterThanOrEqualTo(v2));
	ok(!v1.isLesserThan(v2));
	ok(v1.isLesserThanOrEqualTo(v2));

	ok(v2.isEqualTo(v1));
	ok(!v2.isGreaterThan(v1));
	ok(v2.isGreaterThanOrEqualTo(v1));
	ok(!v2.isLesserThan(v1));
	ok(v2.isLesserThanOrEqualTo(v1));
});

test("Test comparison methods where both the versions are same but had different parameters in the ctor", () => {
	let v1 = new Version("01.2.003");
	let v2 = new Version("1.02.3");

	ok(v1.isEqualTo(v2));
	ok(!v1.isGreaterThan(v2));
	ok(v1.isGreaterThanOrEqualTo(v2));
	ok(!v1.isLesserThan(v2));
	ok(v1.isLesserThanOrEqualTo(v2));

	ok(v2.isEqualTo(v1));
	ok(!v2.isGreaterThan(v1));
	ok(v2.isGreaterThanOrEqualTo(v1));
	ok(!v2.isLesserThan(v1));
	ok(v2.isLesserThanOrEqualTo(v1));
});

test("Test one version's major number being greater than the other", () => {
	let greater = new Version("50.10.5");
	let lesser = new Version("40.99.99");

	ok(!greater.isEqualTo(lesser));
	ok(greater.isGreaterThan(lesser));
	ok(greater.isGreaterThanOrEqualTo(lesser));
	ok(!greater.isLesserThan(lesser));
	ok(!greater.isLesserThanOrEqualTo(lesser));

	ok(!lesser.isEqualTo(greater));
	ok(!lesser.isGreaterThan(greater));
	ok(!lesser.isGreaterThanOrEqualTo(greater));
	ok(lesser.isLesserThan(greater));
	ok(lesser.isLesserThanOrEqualTo(greater));
});

test("Test major numbers being the same, and the minor numbers are not", () => {
	let greater = new Version("50.30.5");
	let lesser = new Version("50.10.99");

	ok(!greater.isEqualTo(lesser));
	ok(greater.isGreaterThan(lesser));
	ok(greater.isGreaterThanOrEqualTo(lesser));
	ok(!greater.isLesserThan(lesser));
	ok(!greater.isLesserThanOrEqualTo(lesser));

	ok(!lesser.isEqualTo(greater));
	ok(!lesser.isGreaterThan(greater));
	ok(!lesser.isGreaterThanOrEqualTo(greater));
	ok(lesser.isLesserThan(greater));
	ok(lesser.isLesserThanOrEqualTo(greater));
});

test("Test major and minor numbers being the same, and the patch numbers are not", () => {
	let greater = new Version("50.10.5");
	let lesser = new Version("50.10.1");

	ok(!greater.isEqualTo(lesser));
	ok(greater.isGreaterThan(lesser));
	ok(greater.isGreaterThanOrEqualTo(lesser));
	ok(!greater.isLesserThan(lesser));
	ok(!greater.isLesserThanOrEqualTo(lesser));

	ok(!lesser.isEqualTo(greater));
	ok(!lesser.isGreaterThan(greater));
	ok(!lesser.isGreaterThanOrEqualTo(greater));
	ok(lesser.isLesserThan(greater));
	ok(lesser.isLesserThanOrEqualTo(greater));
});

test("Test that we aren't just only comparing the patch", () => {
	let greater = new Version("50.11.1");
	let lesser = new Version("50.10.99");

	ok(!greater.isEqualTo(lesser));
	ok(greater.isGreaterThan(lesser));
	ok(greater.isGreaterThanOrEqualTo(lesser));
	ok(!greater.isLesserThan(lesser));
	ok(!greater.isLesserThanOrEqualTo(lesser));

	ok(!lesser.isEqualTo(greater));
	ok(!lesser.isGreaterThan(greater));
	ok(!lesser.isGreaterThanOrEqualTo(greater));
	ok(lesser.isLesserThan(greater));
	ok(lesser.isLesserThanOrEqualTo(greater));
});

test("toString should return the major, minor, and patch numbers delimited with periods", () => {
	let version = new Version("3.1.0");
	strictEqual(version.toString(), "3.1.0");
});

test("toString should remove 0s at the start of each number", () => {
	let version = new Version("03.1.0");
	strictEqual(version.toString(), "3.1.0");
	version = new Version("3.01.0");
	strictEqual(version.toString(), "3.1.0");
	version = new Version("3.1.00");
	strictEqual(version.toString(), "3.1.0");
});

test("toString should correctly allow more than one digit per number", () => {
	let version = new Version("31.10.9");
	strictEqual(version.toString(), "31.10.9");
});
