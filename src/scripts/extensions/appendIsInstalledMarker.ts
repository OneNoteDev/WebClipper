declare const SETTINGS: string;

console.log(SETTINGS);

let oneNoteWebClipperInstallMarkerClassName = "oneNoteWebClipperIsInstalledOnThisBrowser";
let marker = document.createElement("div");

// We have to be extra careful with undefines as this is executed before the body is rendered
if (marker) {
	marker.className = oneNoteWebClipperInstallMarkerClassName;
	marker.style.display = "none";

	// We need to do this asap so we append it to the documentElement instead of the body
	if (document.documentElement.getElementsByClassName(oneNoteWebClipperInstallMarkerClassName).length === 0) {
		document.documentElement.appendChild(marker);
	}
}
