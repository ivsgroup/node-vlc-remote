
"use strict";

var isWin  = (process.platform == "win32");
var Remote = require("./");

  //not in package dependency, manage this by yourself
var vlc    = require("vlc-player");

var map    = require('mout/object/map');
var values = require('mout/object/values');
var mixIn  = require('mout/object/mixIn');

var splitter = /core input debug: `(.*)' successfully opened/;


var config  = {
  'ignore-config'    : null,
  'no-plugins-cache' : null,
  'no-media-library' : null,
  'config'           : 'blank',
  'no-video-title-show' : null,

  'verbose'          : 3,
  'intf'             : 'dummy',

  'rc-host'          : '127.0.0.1:8088',
  'extraintf'        : 'rc',

  'loop'             : null,
};

if(isWin) mixIn(config, {
  'no-crashdump'     : null,
  'rc-quiet'         : null,
  'dummy-quiet'      : null,
});


module.exports = function(/*[options,] chain*/){
  var args    = [].slice.apply(arguments),
      chain   = args.pop(),
      options = args.shift() || {};


  
  mixIn(config, options.args ||{});
  if(config.intf != "skins2"){
    mixIn(config, {"fullscreen" : null});
  }else{
   mixIn(config, {"video-on-top" : null});
  }


  var cmdargs = values( map(config, function(v, k){
    return '--' + k + '' +(v === null ? '' : '=' + v);
  } ));

  var recorder = vlc(cmdargs);
  var remote = new Remote(options.port, options.host);


  var skin_ready = (config.intf == "skins2") ? false : true;
  recorder.stderr.on('data', (data) => {
    data = "" + data;
    if(!skin_ready)
      if((data).indexOf("using skin file") != -1)
        skin_ready = true;
    if(splitter.test(data)){
      var matches = splitter.exec(data);
      remote.emit('play', matches[1]);
    }
  });


  remote.vlc = recorder;
  var attempt = 0 ;
    //we consider everything ready once we can fetch dummy infos
  function waitVlc(){
    remote.info(function(err , output){
      if (attempt > 20)
        return chain(err)
      if(err || !skin_ready){
        attempt++
        return setTimeout(waitVlc , 200)
       }
       chain();
    })
  }
  waitVlc();

  return remote;
}


