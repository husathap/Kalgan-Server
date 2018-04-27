// No caching!

var videoData = (function(subtitle) {

  var exports = {};

  exports.videoPath = $("#vid-id").html();
  exports.ccData = {};

  exports.pastSubOn = false;  // Indicate if the past sub should be on or not.

  // List of languages that Yandex can handle.
  var langList = ['af', 'ar', 'bg', 'ca', 'zh', 'hr', 'cs',
	'da', 'nl', 'en', 'et', 'fj', 'fi', 'fr', 'de', 'el',
	'ht', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'sw', 'ko',
	'lv', 'lt', 'mg', 'ms', 'mt', 'no', 'fa', 'pl', 'pt',
	'ro', 'ru', 'sm', 'sk', 'sl', 'es', 'sv', 'ty', 'th',
	'to', 'tr', 'uk', 'ur', 'vi', 'cy'];

  // Download the closed caption details and put them on the interface.
  $.get({
    url: "https://video.google.com/timedtext",
    data: {"type": "list", "v": exports.videoPath},
    success: function(d) {
      var data = JSON.parse(xml2json(d));

      // If there is only one subtitle, data will be weird. We will need to fix it.
      if (!Array.isArray(data.transcript_list)) {
        data.transcript_list = [data.transcript_list];
      }

      if (data.transcript_list) {
        for (var i = 0; i < data.transcript_list.length; i++) {
          var l1 = data.transcript_list[i]["track@lang_code"];
          if (langList.indexOf(l1.substring(0,2)) != -1) {
            if (localStorage.l1 == l1)
              $("#l1-select").append("<option selected>" + l1 + "</option>");
            else
              $("#l1-select").append("<option>" + l1 + "</option>");
          }
        }

        for (var i = 0; i < langList.length; i++) {
          var l2Dialects = [];

          for (var j = 0; j < data.transcript_list.length; j++) {
            var l2 = data.transcript_list[j]["track@lang_code"];
            if (langList[i] == l2.substring(0,2)) {
              l2Dialects.push(l2);
            }
          }

          if (l2Dialects.length > 0) {
            for (var j = 0; j < l2Dialects.length; j++) {
              if (localStorage.l2 == l2Dialects[j]) {
                $("#l2-select").append("<option selected data='sub'>" + l2Dialects[j] + "</option>");
              } else {
                $("#l2-select").append("<option data='sub'>" + l2Dialects[j] + "</option>");
              }
            }
          } else {
            if (localStorage.l2 == langList[i]) {
              $("#l2-select").append("<option selected data='nosub'>" + langList[i] + " [No Subtitle]</option>");
            } else {
              $("#l2-select").append("<option data='nosub'>" + langList[i] + " [No Subtitle]</option>");
            }
          }
        }

        $("#l1-select").prop("disabled", false);
        $("#l2-select").prop("disabled", false);
        $("#l-select-button").prop("disabled", false);
      }
    }
  });

  // Execute when all subtitles are downloaded.
  exports.langPromise = new MultiPromises(2, function() {

    // Setting up subtitle data.
    exports.subdata = [];

    if (exports.l1Code)
      exports.subdata.push(convertSub(exports.l1RawSub));
    else
      exports.subdata.push(null);

    if (exports.l2Code && exports.l2RawSub)
      exports.subdata.push(convertSub(exports.l2RawSub));
    else
      exports.subdata.push(null);

    // Start without subtitle.
    exports.currentLang = 0;

    // Update interface to reflect language choice.
    menu.langLoaded();

    // Allow the user to interact with the player, finally.
    player.playVideo();
    $("#control-surface").css("opacity", "0");
  });

  // When Continue is clicked, load subtitle details.
  $("#l-select-button").click(function() {
    if ($("#l1-select").val() != "None" && $("#l2-select").val() != "None") {
      var l1 = $("#l1-select").val().substring(0,2);
      var l2 = $("#l2-select").val().substring(0,2);

      localStorage.l1 = l1;
      localStorage.l2 = l2;

      $.get({
        url: "https://video.google.com/timedtext",
        data: {"lang": $("#l1-select").val(), "v": exports.videoPath},
        success: function(d) {
          exports.l1RawSub = JSON.parse(xml2json(d));
          exports.l1Code = l1;
          exports.langPromise.progress();
        }
      });

      if ($("#l2-select").find(":selected").attr("data") == "sub") {
        $.get({
          url: "https://video.google.com/timedtext",
          data: {"lang": $("#l2-select").val(), "v": exports.videoPath},
          success: function(d) {
            exports.l2RawSub = JSON.parse(xml2json(d));
            exports.l2Code = l2;
            exports.langPromise.progress();
          }
        });
      } else {
        $("#l2-button").prop("disabled", true).addClass("disabled");
        exports.l2Code = l2;
        exports.langPromise.progress();
      }
    } else {
      exports.langPromise.progress();
      exports.langPromise.progress();
    }
  });

  // Indicate if the subtitle in the current language can be used or not.
  exports.shouldSub = function() {
    if (exports.currentLang > 0) {
      if (exports.currentLang == 1 && exports.l1Code)
        return 1;
      else if (exports.currentLang == 2 && exports.l2Code)
        return 2;
    }

    return 0;
  }

  // Get the subdata based on the current language. If there exists a sub,
  // return it. Otherwise, return null.
  exports.getSub = function() {
    var subI = exports.shouldSub() - 1;
    return (subI >= 0) ? exports.subdata[subI] : null;
  }

  return exports;

})(subtitle);

// The YouTube loading funtion must be global! /////////////////////////////////

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player-video', {
    height: '100vh',
    width: '100%',
    videoId: videoData.videoPath,
    events: {
      'onReady': onPlayerReady,
    },
    playerVars: {
      'controls': 0,
      'rel': 0,
      'showinfo': 0,
      'disablekb': 1,
      'iv_load_policy': 3,
      'modestbranding': 1,
      'cc_load_policy': 0
    }
  });
}

function onPlayerReady(event) {
  $("#duration").html(genTimestamp(player.getDuration()));

  setInterval(function() {
    if (player.getPlayerState() == 1) {
      updateTimeline();
    }
  }, 5);

  setInterval(function() {
    if (player.getPlayerState() == 1) {
      subtitle.update();
    }
  }, 500);
}

// Update the timeline.
function updateTimeline() {
  var curTime = player.getCurrentTime();
  var duration = player.getDuration();

  $("#timeline-fill").css("height", String(curTime / duration * 100) + "%");
  $("#timestamp-content").html(genTimestamp(curTime) + " [" + String(player.getPlaybackRate()) + "x]");
  $("#timestamp").css("top", String(curTime / duration * 100) + "%");
}

// Event handling for scrubbing the timeline ///////////////////////////////////

// Set up the video clicked event.
var timelineMouseDown = false;

$("#timeline").mousedown(function(e) {
  e.preventDefault();
  timelineMouseDown = true;
  tracker.startRecordScrub(true, player.getCurrentTime());
});

$("#timeline").mouseup(function(e) {
  e.preventDefault();
  if (timelineMouseDown) {
    timelineMouseDown = false;
    $("#timeline-fill").height(e.clientY);
    player.seekTo($("#timeline-fill").height() / $("#timeline").height() * player.getDuration());
    tracker.endRecordScrub(true, $("#timeline-fill").height() / $("#timeline").height() * player.getDuration());
  }
});

$("#timeline").mousemove(function(e) {
  e.preventDefault();
  if (timelineMouseDown) {
    $("#timeline-fill").height(e.clientY);
    player.seekTo($("#timeline-fill").height() / $("#timeline").height() * player.getDuration());
  }
});

document.getElementById("timeline").addEventListener("touchmove", function(e) {
  for (let t of e.touches) {
    $("#timeline-fill").height(t.clientY);
    player.seekTo($("#timeline-fill").height() / $("#timeline").height() * player.getDuration(), true);
  }
});

// TODO: TEST BELOW PART!

var timelineTouched = false;

document.getElementById("timeline").addEventListener("touchstart", function(e) {
  timelineTouched = true;
  tracker.startRecordScrub(false, player.getCurrentTime());
});

document.getElementById("timeline").addEventListener("touchend", function(e) {
  if (timelineTouched) {
    timelineTouched = false;
    $("#timeline-fill").height(e.clientY);
    player.seekTo($("#timeline-fill").height() / $("#timeline").height() * player.getDuration(), true);

    tracker.endRecordScrub(false, $("#timeline-fill").height() / $("#timeline").height() * player.getDuration());
  }
});

////////////////////////////////////////////////////////////////////////////////
