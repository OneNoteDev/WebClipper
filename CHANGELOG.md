# Change Log

## 3.10.4 (December 2024)
Improvement : Completed the migration to Manifest V3 on Microsoft Edge.

## 3.10.3 (December 2024)
Improvement : Disabled the extension for unclippable pages and fixed telemetry logging

## 3.10.2 (December 2024)
Improvement : Removed the notification permission

## 3.10.1 (December 2024)
* Bug : Fixed showing tooltip consistently on video and pdf clips. 

## 3.10.0 (December 2024)
* Improvement : Completed the migration to Manifest V3 on Google Chrome.

## 3.9.8 (October 2024)
* Improvement : Partial code improvements in order to comply with Manifest V3.

## 3.9.7 (October 2024)
* Improvement : Partial code improvements in order to comply with Manifest V3.

## 3.9.6 (October 2024)
* Improvement : XMLHttpRequest() replaced with global fetch().

## 3.9.5 (June 2023)
* Improvement : Deprecating the extension in Firefox.

## 3.9.4 (June 2023)
* Improvement : Client side changes to flush logs before reinitializing logger.

## 3.9.3 (June, 2023)
* Improvement : Client Side changes to Reinit logging based on data boundary.

## 3.9.2 (May, 2023)
* Improvement : Client Side changes to determine data boundary on user info.

## 3.9.1 (Februrary, 2023)
* Improvement : aria logging lib version update for compliance

## 3.9.0 (December, 2022)
* Empty release

## 3.8.9 (November, 2022)
* Improvement: Added a11y improvements

## 3.8.8 (April, 2022)
* Add UserInfo.Id tag back for telemetry

## 3.8.7 (March, 2022)
* Empty release

## 3.8.6 (February, 2022)
* Improvement: Removed EUII/customer data from being logged

## 3.8.5 (October, 2021)
* Improvement: Removing feedback button for MSA accounts

## 3.8.4 (July 22, 2021)
* Improvement: Added a11y improvements

## 3.8.3 (June 20, 2021)
* Improvement: Added a11y improvements
* Improvement: Updated icons from PNG to SVG

## 3.8.2 (September 22, 2020)
* Improvement: Added a11y improvements
* Removed unused webRequestBlocking extension permission

## 3.8.1 (May 30, 2019)
* Improvement: Added a11y improvements

## 3.8.0 (June 20, 2018)
* Improvement: Added a11y improvements for navigation

## 3.7.3 (April 28, 2017)
* Bug: Ignore large binary files that may be injected by some extensions

## 3.7.2 (April 5, 2017)
* Bug: Fixed an undefined reference when using the Clipping hotkey (Alt + C)
* Bug: Fixed article mode with pages containing code (defined by the &lt;pre&gt; or &lt;code&gt; tags)

## 3.7.0 (March 29, 2017)
* Improvement: The OneNote Web Clipper is now a11y compliant!
* Improvement: In region mode, renamed the cancel button to "Back".
* Bug: Minor logging change to the GetExistingUserInfo call.

## 3.6.0 (February 17, 2017)
* Bug: We were still injecting an empty div into the non-Chrome browsers. This fixes that situation.

## 3.5.2 (February 17, 2017)
* Bug: Fix Region mode being off on high dpi screens like Retina or Surface Book in Firefox
* Bug: Article mode was sometimes being shown when we should have been in PDF mode.

## 3.4.5 (February 1, 2017)
* Bug: Unable to sign into Edge because of third-party cookie detection issue.

## 3.4.3 (January 18, 2017)
* Bug: No longer inject an empty div into every page (issues #166, #303)

## 3.4.2 (January 11, 2017)
* Bug: Sign-in errors on O365 were not getting bubbled up to the user (issue #296)
* Bug: Message around having third-party cookies disabled should also include the need to add live.com as an exception as well.

## 3.4.1 (January 4, 2017)
* Bug: Some pages were not clipping the embedded YouTube videos (issue #291)

## 3.4.0 (January 4, 2017)
* Improvement: Added logic to detect when cookies cannot be written to be able to show a better message to the user.
* Improvement: Updated the logic for determining when we show the tooltip/what's new dialog.
* Bug: Fixed incorrect classification of product/recipe/article.
* Bug: On large PDF clips ensure that the token does not expire mid-clip.

## 3.3.0 (December 9, 2016)
* Improvements to PDF mode, including UI tweaks, as well as the ability to save off each page in the PDF as a seperate page in OneNote
* Added the ability for users to grab Vimeo/Youtube videos with Selection mode
* Misc. bug fixes.

## 3.2.15 (November 14, 2016)
* Improvement: Improved logging around the PDF scenario.
* Improvement: Added retry logic around the XHR requests.
* Improvement: Cleaned up the promise logic and logging around the SaveToOneNote object.

## 3.2.11 (October 28, 2016)
* Bug: Removed the code which caused a need for additional permissions in Chrome.

## 3.2.10 (October 28, 2016)
* Improvement: Added additional logging around the PDF Feature.
* Improvement: Improved the code around submitting the PDF patch requests.

## 3.2.9 (October 28, 2016)
* Feature: Much improved PDF support
* Bug: Fixed crash in Safari on sign-out.
* Bug: Add a better error message when people hit the SharePoint limits.
* Feature: Add support for Vimeo ondemand.
* Feature: Add ability to select text in a PDF and clip.

