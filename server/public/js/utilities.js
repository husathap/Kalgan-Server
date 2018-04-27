// Utilities.js is a file containing functions that are useful for the program.//

//Set up the duration.
function genTimestamp(seconds) {

  var hr;
  var rawHour = Math.floor(seconds / (60 * 60));
  if (Math.floor(rawHour) == 0) {
    hr = "00";
  } else if (Math.floor(rawHour) < 10) {
    hr = "0" + String(rawHour);
  } else if (Math.floor(rawHour) >= 10) {
    hr = String(rawHour);
  }

  var min;
  var rawMin = Math.floor((seconds - rawHour * 60) / 60);
  if (parseInt(rawMin) == 0) {
    min = "00";
  } else if (parseInt(rawMin) < 10) {
    min = "0" + String(rawMin);
  } else if (parseInt(rawMin) >= 10) {
    min = String(rawMin);
  }

  var sec;
  var rawSec = Math.floor(seconds - rawHour * (60 * 60) - rawMin * 60);
  if (parseInt(rawSec) == 0) {
    sec = "00";
  } else if (parseInt(rawSec) < 10) {
    sec = "0" + String(rawSec);
  } else if (parseInt(rawSec) >= 10) {
    sec = String(rawSec);
  }

  return hr + ":" + min + ":" + sec;
}

// Multi promises is a prototype for asynchronous programming. It relies on
// multiple promises being done before it moves on.
function MultiPromises(countRequired, then) {
  this.count = 0;
  this.fulfilled = false;
  then = then;

  this.progress = function() {
    if (!this.fulfilled) {
      this.count++;

      if (this.count === countRequired) {
        this.fulfilled = true;
        then();
      }
    } else {
      throw "Promises already fulfilled!";
    }
  }
}

// Convert sub function
// convertSub is a function that converts a raw converted YouTube closed caption
// into something that Caracas can work with.
function convertSub(raw) {
  var temp = [];

  for (var i = 0; i < raw.transcript.length; i++) {
    var entry = raw.transcript[i];

    var start = parseFloat(entry["text@start"]);
    var end = parseFloat(entry["text@dur"]) + start;
    var text = entry["text"];

    temp.push({"begin":start, "end":end, "text":text});
  }

  return temp;
}
