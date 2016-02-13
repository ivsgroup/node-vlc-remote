"use strict";

var vlc = require('./player');


var player = vlc(function(){
  console.log("ready");


  setTimeout(function(){
    player.play("test/video0.mp4", function(){} );
  }, 1000);

  setInterval(function(){
    player.getLength(function(err, length){
      console.log("Got", err, length);
    } );

  }, 400);

});