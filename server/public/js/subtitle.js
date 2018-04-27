// The class for preparing subtitle.

var subtitle = (function(document, $, MultiPromises, videoData) {

  // Called when updating the subtitle.
  function updateSubtitle() {

    var subdata = videoData.getSub();

    if (!subdata) return;

    // Find the current subtitle index.
    var subIndex = -1;

    for (var i = 0; i < subdata.length; i++) {
      var d = subdata[i];
      if (player.getCurrentTime() >= d.begin && player.getCurrentTime() <= d.end) {
        subIndex = i;
        break;
      }
    }

    if (subIndex == -1) {
      $("#subtitle").html("");
    } else {
      var subAtIndex = subdata[subIndex];

      if (subAtIndex.text) {
        var subHTML = "";

        // Process the current subtitle ////////////////////////////////////////

        // These steps are to convert HTML entities into normal characters.
        // Sad!
        $("body").append("<div id='dummy'>" + subAtIndex.text + "</div>")
        var decodedText = $("#dummy").text();
        $("#dummy").remove();

        tSplit = decodedText.split(/[ |\t]+/);

        for (const w of tSplit) {

          if (w.match(/\n|\r/)) {
            subHTML += "<br>"
          } else {
            // Clean word and add into the display subtitle line.
            var cleanedWord = w.replace(/\s+[^a-z]|\s+[^a-z]/ig, '').toLowerCase();
            subHTML += "<a href='#' class='subtitle-word' word='" + cleanedWord + "'>" + w + "</a>&nbsp;";
          }
        }

        subHTML = subHTML.trim();

        if ($("#subtitle").html() != subHTML) {
          // Update the current subtitle.
          $("#subtitle").html(subHTML);

          // Rerouting the events.
          $(".subtitle-word").unbind("mousedown");
          $(".subtitle-word").mousedown(lookup);
        }
      }
    }

    // Process the past subtitle ///////////////////////////////////////////
    if (videoData.pastSubOn) {

      var prevSub;

      if ($("#subtitle").text() != "") {
        // If the current sub's position is known, then pick the previous one.
        prevSub = subdata[subIndex-1]
      } else {
        // If the current sub's position is unknown, then find the
        var curTime = player.getCurrentTime();

        if (curTime > subdata[subdata.length-1].end) {
          // If the current time is more than the end time of the last sub, set it
          // to the previous subtitle to the last sub.
          prevSub = subdata[subdata.length-1];
        } else {
          // Otherwise, search for the previous sub. Find the sandwiching subtitles.

          for (var i = 0; i < subdata.length - 1; i++) {
            if (curTime >= subdata[i].end && curTime <= subdata[i+1].begin) {
              prevSub = subdata[i];
            }
          }
        }
      }

      if (prevSub) {

        var pastSubHTML = "";

        $("body").append("<div id='dummy'>" + prevSub.text + "</div>")
        var decodedText = $("#dummy").text();
        $("#dummy").remove();

        tSplit = decodedText.split(/[ |\t]+/);

        for (const w of tSplit) {

          if (w.match(/\n|\r/)) {
            pastSubHTML += "<br>"
          } else {
            // Clean word and add into the display subtitle line.
            var cleanedWord = w.replace(/\s+[^a-z]|\s+[^a-z]/ig, '').toLowerCase();
            pastSubHTML += "<a href='#' class='subtitle-word' word='" + cleanedWord + "'>" + w + "</a>&nbsp;";
          }
        }

        pastSubHTML = pastSubHTML.trim();

        $("#subtitle-past").html(pastSubHTML);
        $(".subtitle-word").unbind("mousedown");
        $(".subtitle-word").mousedown(lookup);
      }
    }
  }

  // When the loading is done, load the dictioanry.
  function lookup(e) {

    if (videoData.l1Code != undefined && videoData.l2Code != undefined) {

      var l1 = (videoData.currentLang == 1) ? videoData.l1Code : videoData.l2Code;
      var l2 = (videoData.currentLang == 1) ? videoData.l2Code : videoData.l1Code;

      // Clear the box.
      $("#definition")
      .fadeOut(0)
      .css("left", ($(document).width() - $("#definition").width()) / 2)
      .html("Loading please wait...")
      .fadeIn(400)
      .click(function() {$("#definition").fadeOut(400)});

      var word = $(this).attr("word");

      $.getJSON({"url": "/vocab",
      "data": {"from": l1, "to": l2, "text": word},
      "success": function(data) {

        console.log(JSON.stringify(data));

        if (data != null) {

          if (data.status == "success") {

            var display = "<span style='font-weight:bold'>" + word + ":</span> " +  data.result;
            $("#definition").html(display).css("left", ($(document).width() - $("#definition").width()) / 2);

            $("#word-history").append("<div>" + display + "</div>");

            $("#timeline-pane").append("<div class='word" + String(videoData.currentLang) +
            "' style='top:" + String(player.getCurrentTime() / player.getDuration() * 100) + "%'>" + word + "</div>");

            tracker.record("wordLookup", "word:" + word + "|definition:" + data.result + "|status:succcess|langFrom:" + l1 + "|langTo:" + l2);
          } else {
            $("#definition").html("Definition not found.").css("left", ($(document).width() - $("#definition").width()) / 2);
            tracker.record("wordLookup", "word:" + word + "|definition:-" + "|status:fail|langFrom:" + l1 + "|langTo:" + l2);
          }

        } else {
          $("#definition").html("Definition not found.").css("left", ($(document).width() - $("#definition").width()) / 2);
          tracker.record("wordLookup", "word:" + word + "|definition:-" + "|status:fail|langFrom:" + l1 + "|langTo:" + l2);
        }

      },
      "error": function(data) {
        $("#definition").html("Server error.").css("left", ($(document).width() - $("#definition").width()) / 2);
        tracker.record("wordLookup", "word:" + word + "|definition:-" + "|status:fail|langFrom:" + l1 + "|langTo:" + l2);
      }
    });
  }
}

// Setting up public members.
var exports = {};

exports.clearSub = function() {
  $("#subtitle").html("");
}

exports.update = function () {

  var subdata = videoData.getSub();

  // If there is no selected subtitle or the subtitle is empty. Just quit.
  if (!subdata) {
    $("#subtitle").html("");
  } else {

    // If current time is less than the first subtitle, clear it.
    if (player.getCurrentTime() < subdata[0].begin) {
      $("#subtitle").html("");
      return;
    } else {
      // Actually update the subtitle
      updateSubtitle();
    }
  }
}

return exports;
})(document, $, MultiPromises, videoData);
