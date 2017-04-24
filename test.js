"use strict";

var vlc = require('./player');


var player = vlc(function(){
  console.log("ready");


  player.on('play', function(path){
    console.log("Playing", path);
  });

  setTimeout(function(){
    console.log('run play')
    player.play("test/video 0.mp4")
    .then((data)=>{console.log(data)})
    .catch((err)=>{console.log(err)})
  }, 1000);

  setInterval(function(){
    player.getLength().then((length)=>{
      console.log("Got", err, length);
    });

  }, 400);

});