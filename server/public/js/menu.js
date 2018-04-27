// Validation test

var menu = (function(videoData) {
  // Hide the menu control before evertyhing else!
  $(".menu").fadeOut(0);
  $("#definition").fadeOut(0);
  $("#word-history").fadeOut(0);

  // Make the chrome button draggable.
  $("#chrome-button").draggable({
    addClasses: false,
    helper: "clone",
    opacity: 0.85,
  });

  $("#word-history").draggable();

  // Make the control surface summon the menu.
  $("#control-surface").on("mousedown", function(e) {
    if ($("#control-surface").css("opacity") == 0) {
      e.preventDefault();
      exports.toggleMenu(e);

      // Solution from: http://blog.bripkens.de/2010/12/trigger-jquery-ui-drag-start-event/
      $("#chrome-button").simulate("mousedown", { clientX: e.clientX, clientY: e.clientY });

      // Tracking
      tracker.recordMenu(e.clientX, e.clientY, false);
    }
  }).on("touchmove", function(e) {
    if ($("#control-surface").css("opacity") == 0) {
      e.preventDefault();
      exports.toggleMenu(e.touches[0]);

      for (var i = 1; i < e.touches.length; i++) {
        $("#chrome-button").simulate("mousedown", { clientX: e.clientX, clientY: e.clientY });

        // Tracking
        tracker.recordMenu(e.clientX, e.clientY, true);
      }
    }
  });

  // Special binding function
  /*  obj: object for binding.
  func: function to be executed when object is both clicked or dropped on
  clickFunc: function to execute when clicked
  dropFunc: function to execute when dropped on
  dragOver: what to do when the item is dragged over

  tracking: name of the tracking action
  trackingData: additional data for tracking.
  */
  function bindMenu(obj, func, clickFunc, dropFunc, tracking, getTrackingData) {
    obj.click(function(e) {
      if (func) func(e);
      if (clickFunc) clickFunc(e);
      if (tracking && getTrackingData) {
        var data = getTrackingData();
        tracker.recordTap(tracking, data);
      }
    })

    obj.droppable({
      drop: function(e, ui) {
        if (func) func(e, ui);
        if (dropFunc) dropFunc(e, ui);
        if (tracking && getTrackingData) {
          var data = getTrackingData();
          tracker.recordDrag(tracking, data);
        }
      }
    });
  }

  var exports = {};

  exports.explicitPause = false;

  exports.langLoaded = function() {
    if (videoData.l1Code)
      $("#l1-button").html(videoData.l1Code.substring(0,2));
    else
      $("#l1-button").html("🚫")

    if (videoData.l2Code)
      $("#l2-button").html(videoData.l2Code.substring(0,2));
    else
      $("#l2-button").html("🚫")
  }

  exports.toggleMenu = function(e) {
    if ($(".menu").css("display") == "none") {
      $(".menu").fadeIn(400);
      $("#play-button")
      .css("left", e.clientX - $("#play-button").width() / 2)
      .css("top", e.clientY - $("#play-button").height() / 2);

      $(".button")
      .height($("#play-button").height())
      .width($("#play-button").width());

      $("#l2-button")
      .css("left", $("#play-button").css("left"))
      .css("top", $("#play-button").position().top - $("#nosub-button").height());

      $("#nosub-button")
      .css("left", $("#play-button").position().left - $("#l1-button").width())
      .css("top", $("#play-button").position().top - $("#l1-button").height());

      $("#l1-button")
      .css("left", $("#play-button").position().left + $("#l2-button").width())
      .css("top", $("#play-button").position().top - $("#l2-button").height());

      $("#rewindsub-button")
      .css("left", $("#play-button").position().left - $("#play-button").width())
      .css("top", $("#play-button").position().top);

      $("#pastsub-button")
      .css("left", $("#play-button").position().left - $("#play-button").width())
      .css("top", $("#play-button").position().top + $("#play-button").height());

      $("#fullspeed-button")
      .css("left", $("#play-button").position().left)
      .css("top", $("#play-button").position().top + $("#play-button").height());

      $("#halfspeed-button")
      .css("left", $("#play-button").position().left + $("#play-button").width())
      .css("top", $("#play-button").position().top + $("#play-button").height());

      $("#fastforwardsub-button")
      .css("left", $("#play-button").position().left + $("#play-button").width())
      .css("top", $("#play-button").position().top);

	  // NOTE: This functionality has been removed since it seems to confuse everyone involved.
	  
      // Add a flag into timeline
      /*$("#timeline").prepend("<div class='timeline-flag' style='top:" +
      String(Math.round($("#timeline-fill").height() / $("#timeline").height() * 1000) / 1000 * 100) +
      "%'></div>");*/

      // Show  the word history box.
      $("#word-history").fadeIn(400);
    } else {
      $(".menu").fadeOut(400);
      $("#word-history").fadeOut(400);
    }

  }

  // Bind the play button.
  bindMenu($("#play-button"), function(e) {

    if (player.getPlayerState() == 2) {
      exports.explicitPause = false;
      $("#play-button > img").attr("src", "img/pause.png");
      player.playVideo();
    } else {
      exports.explicitPause = true;
      $("#play-button > img").attr("src", "img/play.png");
      player.pauseVideo();
    }
  }, null, exports.toggleMenu, "play-pause", function() {
    return player.getPlayerState() == 2 ? "to:play" : "to:pause"
  });

  // Bind the rewindsub-button subtitle button.
  bindMenu($("#rewindsub-button"), function(e) {
    if (videoData.currentLang == 0 || videoData.getSub().length == 0) {
      var newTime = Math.max(player.getCurrentTime() - 4, 0);
      player.seekTo(newTime);
    } else {

      var subdata = videoData.getSub();
      var curIndex = 0;

      for (var i = subdata.length-1; i >= 0; i--) {
        if (player.getCurrentTime() >= subdata[i].end) {
          curIndex = i;
          break;
        }
      }

      if (curIndex > 1) {
        player.seekTo(subdata[curIndex - 1].begin, true);
      } else {
        subtitle.clearSub();
      }

      subtitle.update();
    }
  }, null, exports.toggleMenu, "rewindSub", function () {return ""});

  // Bind the fastfowardsub-button.
  bindMenu($("#fastforwardsub-button"), function(e) {
    if (videoData.currentLang == 0 || videoData.getSub().length == 0) {
      var newTime = Math.min(player.getCurrentTime() + 4, player.getDuration());
      player.seekTo(newTime);
    } else {
      var subdata = videoData.getSub();

      var curIndex = -1;

      for (var i = 0; i < subdata.length - 1; i++) {
        if (player.getCurrentTime() < subdata[i].begin) {
          curIndex = i;
          break;
        }
      }

      if (curIndex != -1) {
        player.seekTo(subdata[curIndex].begin, true);
      }
    }
  }, null, exports.toggleMenu, "fowardSub", function () {return ""});

  // Binding the subtitle buttons.
  bindMenu($("#nosub-button"), function(e) {
    videoData.currentLang = 0;
    $("#subtitle-past").html("");
    $(".sub-button").removeClass("active");
    $("#nosub-button").addClass("active");
    $("#pastsub-button").addClass("disabled");
    $("#rewindsub-button > img").attr("src", "img/rewind-sub-4.png");
    $("#fastforwardsub-button > img").attr("src", "img/fastforward-sub-4.png");
    subtitle.update();
  }, null, exports.toggleMenu, "noSub", function () {return ""});

  bindMenu($("#l1-button"), function(e) {
    videoData.currentLang = 1;
    $(".sub-button").removeClass("active");
    $("#l1-button").addClass("active");
    $("#pastsub-button").removeClass("disabled");
    $("#rewindsub-button > img").attr("src", "img/rewind-sub.png");
    $("#fastforwardsub-button > img").attr("src", "img/fastforward-sub.png");
    subtitle.update();
  }, null, exports.toggleMenu, "changeSubToL1", function() {
    return "lang:" + videoData.l1Code;
  });

  bindMenu($("#l2-button"), function(e) {
    if (!$("#l2-button").prop("disabled")) {
      videoData.currentLang = 2;
      $(".sub-button").removeClass("active");
      $("#l2-button").addClass("active");
      $("#pastsub-button").removeClass("disabled");
      $("#rewindsub-button > img").attr("src", "img/rewind-sub.png");
      $("#fastforwardsub-button > img").attr("src", "img/fastforward-sub.png");
      subtitle.update();
    }
  }, null, exports.toggleMenu, "changeSubToL2", function() {
    return "lang:" + videoData.l2Code + "|disabled:" + String($("#l2-button").prop("disabled"));
  });

  // Binding the fast-forward button

  function fastforwardColor(e) {
    var newColor = Math.floor(((e.clientX - $("#fastforward-button").position().left) / $("#fastforward-button").width()) * 255);
    $("#fastforward-button").css("background-color", "rgb(0," + newColor + ", 0)");

    $("#scrubbing-num")
    .css("background-color", "rgb(0," + newColor + ", 0)")
    .css("visibility", "visible")
    .html(Math.round((e.clientX - $("#fastforward-button").position().left) / $("#fastforward-button").width() * rewindSpeed * 1000) / 1000)
    .css("left", e.clientX -  $("#scrubbing-num").width() / 2)
    .css("top", e.clientY - 70);
  }

  var trackFastforwardBy = 0;
  bindMenu($("#fastforward-button"), function(e) {
    var newTime = player.getCurrentTime() + (e.clientX - $("#fastforward-button").position().left) / $("#fastforward-button").width() * rewindSpeed;
    player.seekTo(Math.min(newTime, player.getDuration()));
    updateTimeline();

    trackFastforwardBy = (e.clientX - $("#fastforward-button").position().left) / $("#fastforward-button").width() * rewindSpeed;
  }, null, function() {
    $("#scrubbing-num").css("visibility", "collapse");
    $("#fastforward-button").css("background-color", "rgba(0,0,0,0.8)");
    exports.toggleMenu();
  }, "fastforward", function() {
    return "by:" + String(trackFastforwardBy)
  })

  $("#fastforward-button").mousemove(fastforwardColor)
  .on("mouseleave dropout", function() {
    $("#scrubbing-num").css("visibility", "collapse");
    $("#fastforward-button").css("background-color", "rgba(0,0,0,0.8)");
  })

  // Binding the rewind button.
  function rewindColor(e) {
    var newColor = Math.floor((1 - (e.clientX - $("#rewind-button").position().left) / $("#rewind-button").width()) * 255);
    $("#rewind-button").css("background-color", "rgb(" + newColor + ", 0, 0)");

    $("#scrubbing-num")
    .css("background-color", "rgb(" + newColor + ", 0, 0)")
    .css("visibility", "visible")
    .html(Math.round((1 - (e.clientX - $("#rewind-button").position().left) / $("#rewind-button").width()) * rewindSpeed * 1000) / 1000)
    .css("left", e.clientX -  $("#scrubbing-num").width() / 2)
    .css("top", e.clientY - 70);
  }

  var trackRewindBy = 0;
  bindMenu($("#rewind-button"), function(e) {
    var newTime = player.getCurrentTime() - (1 - (e.clientX - $("#rewind-button").position().left) / $("#rewind-button").width()) * rewindSpeed;
    player.seekTo(Math.max(newTime, 0));
    updateTimeline();

    trackRewindBy = (1 - (e.clientX - $("#rewind-button").position().left) / $("#rewind-button").width()) * rewindSpeed;
  }, null, function() {
    $("#scrubbing-num").css("visibility", "collapse");
    $("#rewind-button").css("background-color", "rgba(0,0,0,0.8)");
    exports.toggleMenu();
  }, "rewind", function() {
    return "by:" + String(trackRewindBy);
  })

  $("#rewind-button").mousemove(rewindColor)
  .on("mouseleave dropout", function() {
    $("#scrubbing-num").css("visibility", "collapse");
    $("#rewind-button").css("background-color", "rgba(0,0,0,0.8)");
  });

  // Binding the chrome button when it's being dragged.
  $("#chrome-button").on("drag", function(e) {
    var r = $("#rewind-button");
    var rpos = r.position();

    var ff = $("#fastforward-button");
    var ffpos = ff.position();

    if (e.clientX >= rpos.left &&
        e.clientX <= rpos.left + r.width()  &&
        e.clientY >= rpos.top &&
        e.clientY <= rpos.top + r.height()) {
      rewindColor(e);
    } else if (e.clientX >= ffpos.left &&
        e.clientX <= ffpos.left + ff.width()  &&
        e.clientY >= ffpos.top &&
        e.clientY <= ffpos.top + ff.height()) {
      fastforwardColor(e);
    } else {
      $("#scrubbing-num").css("visibility", "collapse");
      $("#rewind-button").css("background-color", "rgba(0,0,0,0.8)");
      $("#fastforward-button").css("background-color", "rgba(0,0,0,0.8)");
    }
  });

  // Binding the full-speed button.
  $("#fullspeed-button").on("click", function() {
    player.setPlaybackRate(1);
    $("#fullspeed-button").addClass("active");
    $("#halfspeed-button").removeClass("active");

    tracker.record("changeSpeed", "newSpeed:1");
  });

  // Binding the half-speed button.
  $("#halfspeed-button").on("click", function() {
    player.setPlaybackRate(0.5);
    $("#fullspeed-button").removeClass("active");
    $("#halfspeed-button").addClass("active");

    tracker.record("changeSpeed", "newSpeed:0.5");
  });

  // Binding the past-sub button.
  $("#pastsub-button").on("click", function() {
    if (videoData.currentLang > 0) {
      videoData.pastSubOn = !videoData.pastSubOn;

      if (videoData.pastSubOn) {
        $("#pastsub-button").addClass("active");
        tracker.record("pastSubOn", "");
      } else {
        $("#pastsub-button").removeClass("active");
        $("#subtitle-past").html("");
        tracker.record("pastSubOff", "");
      }
    }
  })

  return exports;
})(videoData);
