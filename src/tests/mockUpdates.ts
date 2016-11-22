import {ChangeLog} from "../scripts/versioning/changeLog";

export module MockUpdates {
	export function getMockUpdates(): ChangeLog.Update[] {
		return [{
			"version": "3.1.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t1",
				"description": "d1",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t2",
				"description": "d2",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t3",
				"description": "d3",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t4",
				"description": "d4",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}]
		}];
	}

	export function getMockUpdatesWithSomeImages(): ChangeLog.Update[] {
		return [{
			"version": "3.1.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t1",
				"description": "d1",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t2",
				"imageUrl": "http://www.mywebsite.fake/2.jpeg",
				"description": "d2",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t3",
				"description": "d3",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t4",
				"description": "d4",
				"imageUrl": "http://www.mywebsite.fake/4.jpeg",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}]
		}];
	}

	export function getMockMultipleUpdates(): ChangeLog.Update[] {
		return [{
			"version": "3.1.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t1",
				"description": "d1",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t2",
				"description": "d2",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t3",
				"description": "d3",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t4",
				"description": "d4",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}]
		}, {
			"version": "3.0.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t5",
				"description": "d5",
				"supportedBrowsers": ["Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t6",
				"description": "d6",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t7",
				"description": "d7",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}]
		}];
	}
}
