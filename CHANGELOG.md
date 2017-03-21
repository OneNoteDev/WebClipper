# Change Log

## 3.6.1 (March 21, 2017)
* Bug: Add more support for screen readers and tab browsing

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

