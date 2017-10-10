
"use strict";

const spawn   = require('child_process').spawn;

const isWin  = (process.platform == 'win32');
const Remote = require('./');
const debug    = require('debug')('vlc');
const map    = require('mout/object/map');
const values = require('mout/object/values');
const mixIn  = require('mout/object/mixIn');
const sleep  = require('nyks/async/sleep');
const defer  = require('nyks/promise/defer');

const heartbeat_interval =1000;
const splitter = /input debug: `(.*)' successfully opened/;

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


var vlc;
try {
  vlc    = require('vlc-player'); 
} catch(e) {
  vlc  = function(/* args, options */) {
    return spawn.bind(null, 'vlc').apply(null, arguments);
  }
}


class Player extends Remote{
  
  constructor(options) {
    var player_options = mixIn({}, config, (options ||{}).args);
    var port = player_options['rc-host'].split(':')[1];
    var host = player_options['rc-host'].split(':')[0];
    super(port, host)
    this.options = player_options;
  }

  *start(){
    if(this.vlc)
      return Promise.resolve(this);

    var cmdargs = values(map(this.options, function(v, k){
      return '--' + k + '' +(v === null ? '' : '=' + v);
    }));

    this.vlc = vlc(cmdargs);
    var dataBuff = '';

    this.vlc.stderr.on('data', (data) => {
      if(splitter.test(dataBuff)){
        var matches = splitter.exec(dataBuff);
        dataBuff = '';
        this.emit('play', matches[1]);
        debug(`playing ${matches[1]}`);
      }
    })

    if(this.options.intf == "skins2")
      yield this._waitVlcSkin();

    try{
      debug("waiting player server");
      yield this._waitVlcServerStart();
      debug("Player ready");
    }catch(err){
      this.close();
      throw err;
    }
    this.vlc.on('close', this.emit.bind(this, 'close'));
    this.vlc.on('error', this.emit.bind(this, 'error'));

    var heartbeat = () => {
      this.info((err) => {
        if(err){
          this.close();
          clearInterval(heartbeat);
        }
      })
    }
    setInterval(heartbeat, heartbeat_interval);
    Promise.resolve(this);
  }

  close(){
    try{
      this.vlc.kill();
    }catch(err){}
    this.vlc = null;
  }


  *_waitVlcSkin(){
    var waitSkin = defer();
    var skinBuff = '';
    var self = this;
    debug("waiting skin load ");
    this.vlc.stderr.on('data', function listener(data){
      skinBuff = skinBuff + data;
      if((skinBuff).indexOf("using skin file") != -1){
        debug("Skin ready");
        self.vlc.stderr.removeListener('data' , listener);
        waitSkin.resolve();
      }
    });
    return waitSkin;
  }


  *_waitVlcServerStart(){
    var attempt    = 10;
    var shouldWait = true;
    while(shouldWait || !attempt--){
      try{
        let defered = defer();
        this.info(defered.chain.bind(null));
        yield defered;
        shouldWait = false;
      }catch(err){
        sleep(200);
      }
    }
    if(!attempt)
      return Promise.reject('Server not rady');
    Promise.resolve();
  }
}

module.exports = Player;
