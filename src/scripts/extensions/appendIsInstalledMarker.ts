let oneNoteWebClipperInstallMarker = "oneNoteWebClipperIsInstalledOnThisBrowser";
let marker = document.createElement("DIV");
marker.id = oneNoteWebClipperInstallMarker;
marker.style.display = "none";

if (document.body) {
	appendMarker();
} else {
	document.addEventListener("DOMContentLoaded", appendMarker, false);
}

function appendMarker() {
	if (!document.getElementById(oneNoteWebClipperInstallMarker)) {
		document.body.appendChild(marker);
	}
}
