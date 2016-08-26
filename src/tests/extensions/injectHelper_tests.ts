/// <reference path="../../../typings/main/ambient/qunit/qunit.d.ts" />

import {InjectHelper} from "../../scripts/extensions/injectHelper";

QUnit.module("injectHelper", {});

test("isKnownUninjectablePage should return true on about:tabs", () => {
	ok(InjectHelper.isKnownUninjectablePage("about:tabs"));
});

test("isKnownUninjectablePage should return false on a 'regular' site", () => {
	ok(!InjectHelper.isKnownUninjectablePage("www.bing.com"));
	ok(!InjectHelper.isKnownUninjectablePage("https://www.bing.com"));
	ok(!InjectHelper.isKnownUninjectablePage("http://www.bing.com"));
});

test("isKnownUninjectablePage should return false on a blank or undefined input", () => {
	ok(!InjectHelper.isKnownUninjectablePage(""));
	ok(!InjectHelper.isKnownUninjectablePage(undefined));
});
