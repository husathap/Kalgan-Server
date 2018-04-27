// A function for tracking the software.
// !validation!

var tracker = (function() {


  var menuVisible = false;

  exports = {}

  exports.record = function(type, data) {
    $.post({
      url: "track",
      data: JSON.stringify({"type": type, "data":data, "time": new Date(), "videoId": videoData.videoPath, "navAgent": navigator.userAgent, "vidTime":String(player.getCurrentTime())}),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    });
  }

  // Log the menu summoning/hiding
  exports.recordMenu = function(x, y, touch) {

    if (!menuVisible) {
      var data = "screenWidth:" + String(screen.width) + "|";
      data += "screenHeight:" + String(screen.height) + "|";
      data += "menuX:" + String(x) + "|";
      data += "menuY:" + String(y) + "|";
      data += "touch:" + String(touch);
      exports.record("menuSummon", data);
    } else {
      var data = "screenWidth:" + String(screen.width) + "|";
      data += "screenHeight:" + String(screen.height) + "|";
      data += "menuX:" + String(x) + "|";
      data += "menuY:" + String(y) + "|";
      data += "touch:" + String(touch);
      exports.record("menuHide", data);
    }

    menuVisible = !menuVisible;
  }

  // Log drag events
  exports.recordDrag = function(action, moreData) {

    menuVisible = false;

    var data = "drag:true";

    if (moreData) {
      data += "|" + moreData;
    }

    exports.record(action, data);
  }

  // Log tap events
  exports.recordTap = function(action, moreData) {

    menuVisible = false;

    var data = "drag:false";

    if (moreData) {
      data += "|" + moreData;
    }

    exports.record(action, data);
  }

  // Log scrubbing events
  var touched = false;
  var mouseDown = false;
  var vidStart = 0;

  exports.startRecordScrub = function(mouse, startTime) {
    if (mouse) {
      mouseDown = true;
    } else {
      touched = true;
    }

    vidStart = startTime;
  }

  exports.endRecordScrub = function(mouse, time) {
    if (mouse) {
      exports.record("scrub", "touch:false|start:" + String(vidStart) + "|end:" + String(time));
      mouseDown = false;
    } else {
      exports.record("scrub", "touch:true|start:" + String(vidStart) + "|end:" + String(time));
      touched = false;
    }
  }

  return exports;

})();
