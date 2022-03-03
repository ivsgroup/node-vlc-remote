
"use strict";

const spawn   = require('child_process').spawn;

const isWin  = (process.platform == 'win32');
const Remote = require('./remote');

const debug    = require('debug')('vlc');
const map    = require('mout/object/map');
const values = require('mout/object/values');
const mixIn  = require('mout/object/mixIn');
const sleep  = require('nyks/async/sleep');
const defer  = require('nyks/promise/defer');

const vlc    = require('vlc-player');

const heartbeat_interval = 1000;
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

if(isWin) {
  mixIn(config, {
    'no-crashdump'     : null,
    'rc-quiet'         : null,
    'dummy-quiet'      : null,
  });
}



class Player extends Remote {

  constructor(options = {}, vlcfactory = vlc) {
    var player_options = mixIn({}, config, (options || {}).args);
    let [host, port] = player_options['rc-host'].split(':');

    super(port, host);

    this.options = player_options;
    this.vlcfactory = vlcfactory;
  }

  async start() {
    if(this.vlc)
      return;

    var cmdargs = values(map(this.options, function(v, k) {
      return '--' + k + '' + (v === null ? '' : '=' + v);
    }));

    this.vlc = this.vlcfactory(cmdargs, {stdio : ['ignore', 'ignore', 'pipe']});
    var dataBuff = '';

    this.vlc.stderr.on('data', (data) => {
      dataBuff = dataBuff + data;
      if(splitter.test(dataBuff)) {
        var matches = splitter.exec(dataBuff);
        dataBuff = '';
        this.emit('play', matches[1]);
        debug(`playing ${matches[1]}`);
      }
    });

    if(this.options.intf == "skins2")
      await this._waitVlcSkin();

    try {
      debug("waiting player server");
      await this._waitVlcServerStart();
      debug("Player ready");
    } catch(err) {
      this.close();
      throw err;
    }

    debug(`Spawned vlc child pid: ${this.vlc.pid}`);

    this.vlc.on('close', this.emit.bind(this, 'close'));
    this.vlc.on('error', this.emit.bind(this, 'error'));

    var heartbeat = setInterval(() => {
      this.info().catch((err) => {
        this.close();
        clearInterval(heartbeat);
      });
    }, heartbeat_interval);
  }

  close() {
    if(!this.vlc)
      return;

    try {
      this.vlc.kill();
      debug(`killed vlc child pid: ${this.vlc.pid}`);
    } catch(err) {
      debug(err);
    }
    this.vlc = null;
  }


  _waitVlcSkin() {
    var waitSkin = defer();
    var skinBuff = '';
    var self = this;
    debug("waiting skin load ");

    this.vlc.stderr.on('data', function listener(data) {
      skinBuff = skinBuff + data;
      if((skinBuff).indexOf("using skin file") != -1) {
        debug("Skin ready");
        self.vlc.stderr.removeListener('data', listener);
        waitSkin.resolve();
      }
    });
    return waitSkin;
  }


  async _waitVlcServerStart() {
    var attempt    = 10;
    var shouldWait = true;

    while(shouldWait && (attempt--) > 0) {
      try {
        await this.info();
        shouldWait = false;
      } catch(err) {
        await sleep(200);
      }
    }

    if(attempt <= 0)
      throw 'Server not ready';

  }
}

module.exports = Player;
