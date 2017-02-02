var net       = require('net');
var Class     = require('uclass');
var once      = require('nyks/function/once');
var mask      = require('nyks/object/mask');
var async     = require('async');
var Events    = require('uclass/events');


var Remote = new Class({
   Implements : [Events],

  _port : null,
  _host : null,

  playlist : [],

  initialize : function(port, host) {
    this._port = port || 8088;
    this._host = host || "127.0.0.1";
  },

  info  : function(chain) { this._send("info", chain); },
  stop  : function(chain) { this._send("stop", chain); },
  pause : function(chain) { this._send("pause", chain); },
  vratio : function(ratio, chain) {
    if(ratio)
      this._send("vratio " + ratio, chain);
  },
  fullscreen : function(chain) { this._send("fullscreen ", chain); },

  getLength : function(chain){
          //first call to get_length always return 0
    this._send("get_length\r\nget_length", function (err, length) {
      if(err)
        return chain(err);

      chain(null, Number(length.split("\n")[1]));
    });
  },


  playonce : function(file, chain) {
    var self = this,
        meta_delay = 1000; //time to wait for metadata to be ready
    if(self.firstTimeout)
	clearTimeout(self.firstTimeout);
   if(self.secondTimeout)
	clearTimeout(self.secondTimeout);
    self._send("add "+file, function(err) {
      var dateStart = Date.now();
      self.firstTimeout = setTimeout(function(){
        self.getLength(function(err, length) {
          var videoRemainingTime = length * 1000 - (Date.now() - dateStart); 
          self.secondTimeout = setTimeout(function () {
            self.play(self.playlist, chain)
          }, videoRemainingTime  - 500)
        })
      } , meta_delay)
    })
  },

  enqueue : function(files, chain){
    if(typeof files == "string")
      files = [files];

    if(!files.length)
      return chain();

    var verbs = mask(files, "enqueue %2$s", "\r\n");

    this._send(verbs, chain);
  },

  play : function(/*files, [options,] chain*/) {
    
    var self = this;
    var args    = [].slice.apply(arguments),
    chain   = args.pop(),
    files = args.shift() || {};

    if(typeof files == "string")
      files = [files];

    if(!files.length)
      return this.stop(chain);

    this.playlist = files.slice(0);//clone it

    this._send("clear\r\nadd " + files.shift(), function(err){
      if(err)
        return chain(err);
      self.enqueue(files, chain);
    });
  },

  _send : function(str, chain) {
    //console.log('i send :' , str, chain);
   // chain = once(chain);
    chain = chain || Function.prototype;
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
        chain(null , body.trim());
      });

      sock.once("error", /* istanbul ignore next */ function(err){
        chain(err)
      });

      try{
        sock.write(str + "\r\n", function(){
          sock.end();
        });
      }catch (e){  /* istanbul ignore next */ chain(e) }
    });

    sock.on("error", chain);
  },

});


module.exports = Remote;
