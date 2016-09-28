let oneNoteWebClipperInstallMarkerClassName = "oneNoteWebClipperIsInstalledOnThisBrowser";
let marker = document.createElement("DIV");
marker.className = oneNoteWebClipperInstallMarkerClassName;
marker.style.display = "none";

// We need to do this asap so we append it to the documentElement instead of the body
if (document.documentElement.getElementsByClassName(oneNoteWebClipperInstallMarkerClassName).length === 0) {
	document.documentElement.appendChild(marker);
}
