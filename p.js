"use strict";

const promisify = require('nyks/function/promisify');
const Remote = require('./');
const Player = require('./player');




class RemoteP extends Remote {
  *start() {
    yield new Player({}, Function.prototype).start();

  }

  getLength()      /*  *the length of the current stream */     { return promisify(super.getLength, this).apply(this, arguments); }
  info()           /*  *information about the current stream*/  { return promisify(super.info, this).apply(this, arguments); }
  playlist_info()  /*   *show items currently in playlist*/     { return promisify(super.playlist_info, this).apply(this, arguments); }
  toggle_play()    /*   *play stream*/                          { return promisify(super.toggle_play, this).apply(this, arguments); }
  stop()           /*   *stop stream*/                          { return promisify(super.stop, this).apply(this, arguments); }
  next()           /*   *next playlist item*/                   { return promisify(super.next, this).apply(this, arguments); }
  prev()           /*   *previous playlist item*/               { return promisify(super.prev, this).apply(this, arguments); }
  repeat(state)     /*  *state=[on|off] toggle playlist repeat*/{ return promisify(super.repeat, this).apply(this, arguments); }
  loop(state)       /*  *state=[on|off] toggle playlist loop*/  { return promisify(super.loop, this).apply(this, arguments); }
  clear_playlist()  /*  *clear the playlist*/                   { return promisify(super.clear_playlist, this).apply(this, arguments); }
  status()          /*  *current playlist status*/              { return promisify(super.status, this).apply(this, arguments); }
  pause()           /*  *toggle pause*/                         { return promisify(super.pause, this).apply(this, arguments); }
  fullscreen(state) /*  *state=[on|off] toggle fullscreen*/     { return promisify(super.fullscreen, this).apply(this, arguments); }

  stats()           /*  *show statistical information*/         { return promisify(super.stats, this).apply(this, arguments); }
  get_time()        /*  *seconds elapsed since stream's beginning*/ { return promisify(super.get_time, this).apply(this, arguments); }
  is_playing()      /*  *1 if a stream plays, 0 otherwise*/     { return promisify(super.is_playing, this).apply(this, arguments); }
  get_title()       /*  *the title of the current stream*/      { return promisify(super.get_title, this).apply(this, arguments); }
  vratio(ratio)     /*  *set/get video aspect ratio*/           { return promisify(super.vratio, this).apply(this, arguments); }
  snapshot()        /*  *take video snapshot*/                  { return promisify(super.snapshot, this).apply(this, arguments); }
  screenRecorder()  /*  *screen recorde*/                       { return promisify(super.screenRecorder, this).apply(this, arguments); }
  shutdown()        /*  *shutdown vlc*/                         { return promisify(super.shutdown, this).apply(this, arguments); }


  playonce(file) { return promisify(super.playonce, this).apply(this, arguments); }
  play(file)     { return promisify(super.play, this).apply(this, arguments); }

}


module.exports = RemoteP;
