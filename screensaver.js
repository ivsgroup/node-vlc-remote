"use strict";

var player      = require('./player');
var screensaver = require('screensaver-win');


var remote = player(function(){


  ( function stuff(){

    screensaver(5, function(){
      console.log("Screensaver start");

      remote.play("test\\video0.mp4", function(){
        console.log("Playing")
      });


    }, function(){

      remote.stop(function(){
        console.log("stopped")
      });

      stuff(); //do it again !
    })

  })();



});
