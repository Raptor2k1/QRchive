/* 
Beaverhacks Fall 2022
Team: "It's not a bug, it's a feature"
Date: 10/8/2022

Origina/pre-modified source code from open source project at: https://www.sitepoint.com/create-qr-code-reader-mobile-website/
Original scanner library by ZXing, JavaScript Version ported by Lazar Laszlo

Description:  Code for a web-based QR code scanner. Modified from original source code to redirect output from a simple text print
              to also archive the printed information in a JSON file (including time stamp and site title, if it is a legitimate web URL).
              
              **All scanning and image parsing functionality code in this file is from the above cited project.**
              New code contributions are for processing the results of the QR scanning process and for creating a user-interface.
              Code in the first section of this file is a mix of original code and source code from the cited project and is blended
              in some cases where source functions needed to interact with new UI elements.
*/

const qrCode = window.qrcode;

const video = document.createElement("video");
const canvasElement = document.getElementById("qr-canvas");
const cancelBtnElement = document.getElementById("cancel-btn");

const archiveElement = document.getElementById("archive-btn");
const archiveTable = document.getElementById("archive-table");
const clearArchiveBtnElement = document.getElementById("clear-archive-btn");

const clickAboveElement = document.getElementById("click-to-scan");
const addBtnElement = document.getElementById("add-btn");
const addedToElement = document.getElementById("added-to");
const archiveClearedElement = document.getElementById("archive-cleared");
const canvas = canvasElement.getContext("2d");

const qrResult = document.getElementById("qr-result");
const outputData = document.getElementById("outputData");
const btnScanQR = document.getElementById("btn-scan-qr");

let scanning = false;

// Executes when a QR code has been succesfully scanned (mix of open source/new code)
qrCode.callback = (res) => {
  if (res) {
    // Stop scanning and output decoded text
    outputData.innerText = res;
    scanning = false;
    video.srcObject.getTracks().forEach((track) => {
      track.stop();
    });

    // UI element changes when scanning stops
    qrResult.hidden = false;
    clickAboveElement.hidden = false;
    canvasElement.hidden = true;
    btnScanQR.hidden = false;
    addBtnElement.hidden = false;
    outputData.hidden = false;
    addBtnElement.hidden = false;
  }
};

// Starts the scanning process when the QR code "scan" button on the home page is pressed (mix of open source/new code)
btnScanQR.onclick = () => {
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function (stream) {
      scanning = true;
      qrResult.hidden = true;
      btnScanQR.hidden = true;
      archiveElement.hidden = true;
      archiveTable.hidden = true;
      clickAboveElement.hidden = true;
      addedToElement.hidden = true;
      archiveClearedElement.hidden = true;
      cancelBtnElement.hidden = false;
      canvasElement.hidden = false;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.srcObject = stream;
      video.play();
      tick();
      scan();
    });

  // Return back to default screen if cancel button is clicked - hide everything by starting elements
  cancelBtnElement.onclick = () => {
    // Aborts scanning operations
    scanning = false;
    video.srcObject.getTracks().forEach((track) => {
      track.stop();
    });

    // Hide/unhide UI layers
    qrResult.hidden = false;
    archiveElement.hidden = false;
    clickAboveElement.hidden = false;
    cancelBtnElement.hidden = true;
    canvasElement.hidden = true;
    btnScanQR.hidden = false;
    addBtnElement.hidden = true;
  };
};

// Toggles the archive table display on and off. Rebuilds the table with most recent data when turned on
archiveElement.onclick = () => {
  qrResult.hidden = true;
  archiveClearedElement.hidden = true;
  let data = localStorage.getItem("qrHistory");
  if (!data || !data.length) return;
  if (!archiveTable.hidden) {
    archiveTable.hidden = true;
    clearArchiveBtnElement.hidden = true;
  } else {
    archiveUpdate();
    archiveTable.hidden = false;
    clearArchiveBtnElement.hidden = false;
  }
};

// Starts the process of saving a scan to the local storage archive
addBtnElement.onclick = () => {
  // Adds scanned QR code information to local storage
  saveCode(outputData.innerText);
  addedToElement.hidden = false;

  // Hides add button and link once added so that it doesn't get added again upon multiple clicks
  outputData.hidden = true;
  addBtnElement.hidden = true;

  // Hides archive table so next viewing of it is refreshed with the new record
  archiveTable.hidden = true;
  archiveElement.hidden = false;
  cancelBtnElement.hidden = true;
};

// Hides the archive table then wipe its contents
clearArchiveBtnElement.onclick = () => {
  clearArchiveBtnElement.hidden = true;
  archiveTable.hidden = true;
  clearArchive();
  archiveClearedElement.hidden = false;
};


// Tick and scan functions for scanner from project tutorial at https://www.sitepoint.com/create-qr-code-reader-mobile-website/
function tick() {
  canvasElement.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

  scanning && requestAnimationFrame(tick);
}

function scan() {
  try {
    qrCode.decode();
  } catch (e) {
    setTimeout(scan, 300);
  }
}

/* 
End of this portion of cited open-source code. 
All code below this point is original and created specifically for this project.
*/


//Open source tool: https://allorigins.win/
//Pulls contents from remote HTML URL
const getTitle = async (url) => {
  return await fetch(`https://api.allorigins.win/get?url=${url}`)
    .then((response) => {
      // checks whether response status code is not in 200-299 range
      if (!response.ok) {
        throw new Error("Unsuccessful fetch operation. Please try again.");
      }
      return response.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = doc.querySelectorAll("title")[0];
      // if there is no valid title, returns generic placeholder string
      if (!title) {
        let placeholderText = "Untitled";
        return placeholderText;
      }
      console.log(title);
      return title.innerText;
    });
};

// Helper method that takes a string (from the QR scanner results) and saves the URL, its title, and a timestamp entry to an
// archive JSON that can be accessed later to view previously scanned QR codes. Saves JSON locally.
async function saveCode(scanResults) {
  // Set up the qr_info object to be saved to a local file
  const scanText = String(scanResults);
  const urlTitle = String(await getTitle(scanResults));
  const timestampStr = (test_date = new Date().toDateString());
  const qrInfo = { url: scanText, title: urlTitle, date: timestampStr };
  let localData = localStorage.getItem("qrHistory");

  // Sets a blank array for local data, if there is no QR scan history JSON
  if (!localData) {
    localData = [];
  }

  // Parses the QR scan history JSON into a a logical array if the JSON already exists
  else {
    localData = JSON.parse(localData);
  }

  // Adds the QR info object to the history array and updates the JSON with the new array
  localData.push(qrInfo);
  localStorage.setItem("qrHistory", JSON.stringify(localData));
}

// Generates a table and populates it based on qrHistory in local storage
// Modeled off approach at https://stackoverflow.com/questions/64949448/how-to-create-a-table-from-an-array-using-javascript
function archiveUpdate() {
  // Get the QR history from JSON and turn it into logical array
  let localData = localStorage.getItem("qrHistory");
  localData = JSON.parse(localData);

  // Wipe out the old table contents and start fresh!
  archiveTable.innerHTML = "";

  // #archive-table td seems to be what effects the archive table's text
  archiveTable.classList.add('table-style');
  // archiveTable.CssClass = "table-style";

  // Set the headers
  let tableHeaders = ["Result", "Scan Data / URL", "Date"];

  // Loop through localStorage QR history to build and populate the table (in reverse, so most recent is top)
  for (let index = 0; index < localData.length; index++) {
    let current_row = archiveTable.insertRow(index);
    current_row.insertCell(0).innerHTML =
      localData[localData.length - 1 - index].title;
    current_row.insertCell(1).innerHTML =
      localData[localData.length - 1 - index].url;
    current_row.insertCell(2).innerHTML =
      localData[localData.length - 1 - index].date;
  }

  // Create the header and loop through the header array to populate it
  let header = archiveTable.createTHead();
  let headerRow = header.insertRow(0);
  for (let index = 0; index < tableHeaders.length; index++) {
    headerRow.insertCell(index).innerHTML = tableHeaders[index];
  }
}

// "Beak Glass in Case of Emergency" to clear the local archive
function clearArchive() {
  const localData = [];
  localStorage.setItem("qrHistory", JSON.stringify(localData));
}
