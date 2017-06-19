"use strict";

const promisify = require('nyks/function/promisify');
const Remote = require('./');

class RemoteP extends Remote {




  getLength()      /*  *the length of the current stream */     { return promisify(super.getLength, this).apply(this, arguments); }
  info()           /*  *information about the current stream*/  { return promisify(super.info, this).apply(this, arguments); }
  playlist_info()  /*   *show items currently in playlist*/     { return promisify(super.playlist_info, this).apply(this, arguments); }



  playonce(file) { return promisify(super.playonce, this).apply(this, arguments); }
  play(file)     { return promisify(super.play, this).apply(this, arguments); }




  toggle_play()    /*   *play stream*/{ return this._send("play");}
  stop()           /*   *stop stream*/{ return this._send("stop");}
  next()           /*   *next playlist item*/{ return this._send("next");}
  prev()           /*   *previous playlist item*/{ return this._send("prev");}
  repeat(state)     /*  *state=[on|off]                toggle playlist repeat*/{ return this._send("repeat " + state||"");}
  loop(state)       /*  *state=[on|off]                  toggle playlist loop*/{ return this._send("loop " + state||"");}
  clear_playlist()  /*  *clear the playlist*/{ return this._send("clear");}
  status()          /*  *current playlist status*/{ return this._send("status");}
  pause()           /*  *toggle pause*/{ return this._send("pause");}
  fullscreen(state) /*  *state=[on|off]                     toggle fullscreen*/{ return this._send("fullscreen " + state||"");}
  
  stats()           /*  *show statistical information*/{ return this._send("stats");}
  get_time()        /*  *seconds elapsed since stream's beginning*/{ return this._send("get_time");}
  is_playing()      /*  *1 if a stream plays, 0 otherwise*/{ return this._send("is_playing");}
  get_title()       /*  *the title of the current stream*/ { return this._send("get_title");}
  vratio(ratio)     /*  *set/get video aspect ratio*/{ return this._send("vratio " + ratio||""); }
  snapshot()        /*  *take video snapshot*/   { return this._send("snapshot");}


}


module.exports = RemoteP;
