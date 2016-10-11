// Edge/W3C has not yet come to a conclusion as to whether or not they will support Chrome's "incongito" property so
// for now we're extending it to allow for the Edge-equivalant "inPrivate".
interface W3CTab extends chrome.tabs.Tab {
	inPrivate: Boolean;
}
