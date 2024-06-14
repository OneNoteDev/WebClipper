console.log("Content script loaded");

/****** START CODE TO COMMUNICATE BETWEEN BACKGROUND AND CONTENT SCRIPTS ******/

// Listen for a message from the background script
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (window.self !== window.top) {
      // We're in an iframe, ignore the message
      return;
    }
    console.log(JSON.stringify(request));
    if (request === undefined) {
      sendResponse({ cMessage: "Invalid request received by content script" });
    }
    switch (request.bMessage) {
      /*
      case "GET_YOUTUBE_URL":
        sendResponse({ cMessage: !isYoutube() ? "NOT_YOUTUBE" : getYoutubeURL() });
        break;
      case "GET_VIDEO_ID":
        sendResponse({ cMessage: !isYoutube() ? "NOT_YOUTUBE" : getVideoId() });
        break;
      case "GET_STREAM_PLAYER":
        sendResponse({ cMessage: !isYoutube() ? "NOT_YOUTUBE" : (getStreamPlayer() as HTMLElement).outerHTML });
        break;
      */
      case "GET_ALL_YOUTUBE_DETAILS":
        if (!isYoutube()) {
          chrome.runtime.sendMessage({
            youtubeURL: "NOT_YOUTUBE",
            documentTitle: getDocumentTitle(),
            pictureOfVideo: "NOT_YOUTUBE",
            transcript: "NOT_YOUTUBE"
          });
        } else {
          getTranscriptAndReturnAllYoutubeDetails();
        }
        break;
      default:
        sendResponse({ cMessage: "Invalid message received by content script" });
    }
  });

/****** END CODE TO COMMUNICATE BETWEEN BACKGROUND AND CONTENT SCRIPTS ******/

function isYoutube() {
  return document.location.href.indexOf("youtube.com") !== -1;
}

function getDocumentTitle() {
  return document.title;
}

function getStreamPlayer() {
  return document.getElementsByClassName("video-stream")[0];
}

function getPictureOfVideo() {
  const player = getStreamPlayer() as HTMLVideoElement;
  var canvas = document.createElement("canvas");
  canvas.width = player.videoWidth;
  canvas.height = player.videoHeight;
  canvas.getContext("2d").drawImage(player, 0, 0, canvas.width, canvas.height);

  /****** START IMAGE COMPRESSION LOGIC ******/

  // Create a new canvas element
  const newCanvas = document.createElement('canvas');

  // Set the dimensions of the new canvas to the desired size
  newCanvas.width = canvas.width / 10; // Reduce the width
  newCanvas.height = canvas.height / 10; // Reduce the height

  // Get the 2D context of the new canvas
  const ctx = newCanvas.getContext('2d');

  // Draw the image from the original canvas onto the new canvas
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newCanvas.width, newCanvas.height);

  /****** END IMAGE COMPRESSION LOGIC ******/

  // Get the data URL of the image from the new canvas
  const img = newCanvas.toDataURL("image/png");
  return img;
}

function getTranscriptAroundCurrentTimestamp(fullTranscript) {
  var player = getStreamPlayer() as HTMLVideoElement;
  var time = player.currentTime;

  let result = "";

  for (let i = 0; i < fullTranscript.length; i++) {
    if (fullTranscript[i][0] < time - 15) {
      continue;
    }
    if (fullTranscript[i][0] > time + 15) {
      break;
    }
    // Include transcripts within 10 seconds of the current timestamp
    result += fullTranscript[i][1] + " ";
  }

  return result;
}

function getTranscriptAndReturnAllYoutubeDetails() {
  const injectedCode = `
h2 = document.createElement('h2')
h2.id = 'ytTranscript'
h2.innerText = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl
document.getElementById('content').appendChild(h2)
`;
  var script = document.createElement("script");
  script.textContent = injectedCode;
  (document.head).appendChild(script);
  var ytTranscript = document.getElementById('ytTranscript');
  var subsUrl;
  if (ytTranscript) {
    subsUrl = document.getElementById('ytTranscript').innerText;
    let xhr = new XMLHttpRequest();
    xhr.open('GET', subsUrl);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // Manipulate this code to get the timestamp as well
        let xml = new DOMParser().parseFromString(xhr.responseText, 'text/xml');
        let textNodes = Array.prototype.slice.call(xml.getElementsByTagName('text'));
        let subsText = []
        for (const t of textNodes) {
          var obj = [];
          const start = t.getAttribute('start');
          const duration = t.getAttribute('dur');
          obj.push(start)
          obj.push(t.textContent)
          subsText.push(obj)
        }
        console.log(JSON.stringify(subsText));
        chrome.runtime.sendMessage({
          youtubeURL: getYoutubeURL(),
          documentTitle: getDocumentTitle(),
          pictureOfVideo: getPictureOfVideo(),
          transcript: getTranscriptAroundCurrentTimestamp(subsText)
        });
      }
    }
    xhr.send();
  }
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

function getYoutubeURL() {
  var player = getStreamPlayer() as HTMLVideoElement;
  var time = player.currentTime;
  var path = document.location.href;
  path = path.split("?")[0];
  path += "?v=" + getVideoId() + "&t=" + Math.floor(time) + "s";
  return path;
}

console.log("Content script finished executing");
