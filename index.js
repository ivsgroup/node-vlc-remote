"use strict";

const net          = require('net');
const EventEmitter = require('events').EventEmitter;


class Remote extends EventEmitter {

  constructor(port, host) {
    super();
    this.playlist = [];

    this._port = port || 8088;
    this._host = host || "127.0.0.1";
  }
  playlist_info()  /*   *show items currently in playlist*/{ return this._send("playlist");}
  toggl_play()     /*   *play stream*/{ return this._send("play");}
  stop()           /*   *stop stream*/{ return this._send("stop");}
  next()           /*   *next playlist item*/{ return this._send("next");}
  prev()           /*   *previous playlist item*/{ return this._send("prev");}
  repeat(state)     /*  *state=[on|off]                toggle playlist repeat*/{ return this._send("repeat " + state||"");}
  loop(state)       /*  *state=[on|off]                  toggle playlist loop*/{ return this._send("loop " + state||"");}
  clear_playlist()  /*  *clear the playlist*/{ return this._send("clear");}
  status()          /*  *current playlist status*/{ return this._send("status");}
  pause()           /*  *toggle pause*/{ return this._send("pause");}
  fullscreen(state) /*  *state=[on|off]                     toggle fullscreen*/{ return this._send("fullscreen " + state||"");}
  info()            /*  *information about the current stream*/{ return this._send("info");}
  stats()           /*  *show statistical information*/{ return this._send("stats");}
  get_time()        /*  *seconds elapsed since stream's beginning*/{ return this._send("get_time");}
  is_playing()      /*  *1 if a stream plays, 0 otherwise*/{ return this._send("is_playing");}
  get_title()       /*  *the title of the current stream*/ { return this._send("get_title");}
  getLength()       /*  *the length of the current stream*/{   return this._send("get_length\r\nget_length").then((length) => Number(length.split("\n")[1])); }
  vratio(ratio)     /*  *set/get video aspect ratio*/{ return this._send("vratio " + ratio||""); }
  snapshot()        /*  *take video snapshot*/   { return this._send("snapshot");}
 
  playonce(file)/*  * play stream once*/{
    var meta_delay = 1000; //time to wait for metadata to be ready
    if(this.firstTimeout)
      clearTimeout(this.firstTimeout);
    if(this.secondTimeout)
      clearTimeout(this.secondTimeout);
    return new Promise((resolve, reject)=>{
      this._send("add "+file)
      .then(()=>{
        var dateStart = Date.now();
        this.firstTimeout = setTimeout(()=>{
          this.getLength()
          .then((length) =>{
            var videoRemainingTime = length * 1000 - (Date.now() - dateStart); 
            this.secondTimeout = setTimeout(()=>{
              this.play(this.playlist).then(resolve, reject);
            }, videoRemainingTime  - 500)
          })
          .catch(reject);
        } , meta_delay)
      })
      .catch(reject);
    })
  }

  *_playonce_gen(file) {
    var meta_delay = 1000; //time to wait for metadata to be ready
    yield this._send("add "+file) ;
    var dateStart = Date.now();
    yield sleep(meta_delay);
    var length = yield this.getLength();
    var videoRemainingTime = length * 1000 - (Date.now() - dateStart);
    yield sleep(videoRemainingTime  - 500);
    yield this.play(this.playlist);
  }


  enqueue(files)/* *queue files to playlist */ {
    if(typeof files == "string")
      files = [files];

    var verbs = files.map( file => `enqueue ${file}`).join("\r\n");
    return this._send(verbs);
  }

  play()/*   *play streams list*/ {  
    var args    = [].slice.apply(arguments),
      files = args.shift() || [];

    if(typeof files == "string")
      files = [files];

    if(!files.length)
      return this.stop();

    this.playlist = files.slice(0);//clone it

    return new Promise((resolve, reject)=>{
      this._send("clear\r\nadd " + files.shift())
      .then((data) => {
        if(!files.length)
          return resolve(data);
        this.enqueue(files).then(resolve, reject);
      })
      .catch(reject);
    })
  }

  _send(str){
  return new Promise((resolve, reject)=>{
    var dst  = { port: this._port, host:this._host};
    var sock = net.connect(dst, function(){
      sock.setNoDelay();

      var body = "";

      sock.on("data", function(buf){
        body += buf;
      });

      sock.once("end", function(){
        //trim vlc verbosity
        body = body.replace(/status change:.*\r?\n/g, '');
        body = body.replace(/^[\s\S]*?>/, '');
        body = body.replace(/> Bye-bye!.*/, '');
        resolve(body.trim());
      });

      sock.once("error", /* istanbul ignore next */ reject);

      try{
        sock.write(str + "\r\n", function(){
          sock.end();
        });
      }catch (e){  /* istanbul ignore next */ reject(e) }
    });
    sock.on("error", reject);
   })
    

    
  }

}


module.exports = Remote;
