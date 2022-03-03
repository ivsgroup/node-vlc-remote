"use strict";

const net          = require('net');
const {EventEmitter} = require('events');

const defer = require('nyks/promise/defer');

const isWin = process.platform === "win32";


class Remote extends EventEmitter {

  constructor(port = 8088, host = "127.0.0.1") {
    super();

    this.playlist = [];

    this._port = port;
    this._host = host;
  }

  info()            { return this._send("info"); }
  stop()            { return this._send("stop"); }
  pause()           { return this._send("pause"); }
  fullscreen(state) { return this._send("fullscreen " + state || ""); }

  playlist_info()   { return this._send("playlist"); }
  toggle_play()     { return this._send("play"); }

  next()            { return this._send("next"); }
  prev()            { return this._send("prev"); }
  repeat(state)     { return this._send("repeat " + state || ""); }
  loop(state)       { return this._send("loop " + state || ""); }
  clear_playlist()  { return this._send("clear"); }
  status()          { return this._send("status"); }
  stats()           { return this._send("stats"); }
  get_time()        { return this._send("get_time"); }
  is_playing()      { return this._send("is_playing"); }
  get_title()       { return this._send("get_title"); }
  snapshot()        { return this._send("snapshot"); }
  vratio(ratio)     { return this._send("vratio " + ratio || ""); }
  screenRecorder()  { return this._send("add screen://"); }
  shutdown()        { return this._send(isWin ? "quit" : "shutdown"); }

  async getLength() {
    //first call to get_length always return 0 ??
    let length = await this._send("get_length\r\nget_length");
    return Number(length.split("\n")[1]);
  }

  async playonce(file) {

    var meta_delay = 1000; //time to wait for metadata to be ready

    if(Array.isArray(file))
      file = file[0];

    if(this.firstTimeout)
      clearTimeout(this.firstTimeout);

    if(this.secondTimeout)
      clearTimeout(this.secondTimeout);

    await this._send("add " + file);

    var dateStart = Date.now();

    return new Promise((resolve, reject) => {
      this.firstTimeout = setTimeout(async () => {
        let length = await this.getLength().catch(reject);
        var videoRemainingTime = length * 1000 - (Date.now() - dateStart);
        this.secondTimeout = setTimeout(() => {
          this.play(this.playlist).then(resolve);
        }, videoRemainingTime  - 500);
      }, meta_delay);
    });
  }

  enqueue(files) {
    if(typeof files == "string")
      files = [files];

    if(!files.length)
      return;

    var verbs = files.map(file => `enqueue ${file}`).join("\r\n");

    return this._send(verbs);
  }

  async play(files = []) {

    if(typeof files == "string")
      files = [files];

    if(!files.length)
      return this.stop();

    this.playlist = [...files];//clone it

    await this._send("clear\r\nadd " + files.shift());
    await this.enqueue(files);
  }

  _send(str) {
    // it's best to re-connect everytime rather than keeping the socket opened
    let defered = defer();

    var dst  = { port : this._port, host : this._host};

    var sock = net.connect(dst, function() {
      sock.setNoDelay();

      var body = "";

      sock.on("data", function(buf) {
        body += buf;
      });

      sock.once("end", function() {
        //trim vlc verbosity
        body = body.replace(/status change:.*\r?\n/g, '');
        body = body.replace(/^[\s\S]*?>/, '');
        body = body.replace(/> Bye-bye!.*/, '');
        defered.resolve(body.trim());
      });

      try {
        sock.write(str + "\r\n", function() {
          sock.end();
        });
      } catch(e) {
        /* istanbul ignore next */
        defered.reject(e);
      }
    });

    sock.on("error", defered.reject);

    return defered;
  }

}


module.exports = Remote;
