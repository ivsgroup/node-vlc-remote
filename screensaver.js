"use strict";

var player      = require('./player');
var screensaver = require('screensaver-win');


var remote = player(function() {

  let stuff = function() {

    screensaver(5, async function() {
      console.log("Screensaver start");

      await remote.play("test\\video0.mp4");
      console.log("Playing");

    }, async function() {

      await remote.stop();
      console.log("stopped");

      stuff(); //do it again !
    });

  };

  stuff();

});
