console.log("Content script loaded");

// Listen for a message from the background script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(JSON.stringify(request));
    if (request === undefined) {
      sendResponse({ cMessage: "Invalid request received by content script" });
    }
    switch (request.bMessage) {
      case "GET_WINDOW_LOCATION_HREF":
        sendResponse({ cMessage: window.location.href });
        break;
      case "GET_VIDEO_ID":
        sendResponse({ cMessage: getVideoId() });
        break;
      case "GET_STREAM_PLAYER":
        sendResponse({ cMessage: (getStreamPlayer() as HTMLElement).outerHTML });
        break;
      default:
        sendResponse({ cMessage: "Invalid message received by content script" });
    }
  });

function getStreamPlayer() {
  return document.getElementsByClassName("video-stream")[0];
}

function parseParams(href) {
  const noHash = href.split("#")[0];
  const paramString = noHash.split("?")[1];
  const params = {};
  if (paramString) {
    const paramsArray = paramString.split("&");
    for (const kv of paramsArray) {
      const tmparr = kv.split("=");
      params[tmparr[0]] = tmparr[1];
    }
  }
  return params;
}

function getVideoId() {
  if (window.location.pathname == "/watch") {
    return parseParams(window.location.href)["v"];
  } else if (window.location.pathname.indexOf("/embed/") == 0) {
    return window.location.pathname.substring("/embed/".length);
  } else {
    return null;
  }
}

console.log("Content script finished executing");
