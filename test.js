"use strict";

var vlc = require('./player');


var player = new vlc();

player.start().then(function() {

  console.log("ready");

  player.on('play', function(path){
    console.log("Playing", path);
  });


  setTimeout(function(){
    player.play("test/video 0.mp4");
  }, 1000);

  let i = setInterval(async function(){
    let length = await player.getLength();
    console.log("Got length", length);
  }, 400);


  setTimeout(function(){
    player.close();
    clearInterval(i);
  }, 10 * 1000);

  
});
