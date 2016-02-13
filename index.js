var Class     = require('uclass');
var Options   = require('uclass/options');
var once      = require('nyks/function/once');
var net       = require('net');


var Remote = new Class({
  Implements : [Options],

  options : {
    network : {
      port : 8088,
      host:"127.0.0.1"
    }
  },

  playlist : [],

  initialize : function(options) {
    this.setOptions(options)
  },

  info : function(chain) { this._send("info", chain); },
  stop : function(chain) { this._send("stop", chain); },

  getLength : function(chain){
          //first call to get_length always return 0
    this._send("get_length\r\nget_length", function (err, length) {
      chain(null, Number(length.split("\n")[1]));
    });
  },


  playonce : function(file, options , chain) {
    var self = this,
        meta_delay = 1000; //time to wait for metadata to be ready

    self._send("add "+file, function(err) {
      setTimeout(function(){
        self.getLength(function(err, length) {
          setTimeout(function () {
            self.play(self.playlist)
          }, (length * 1000) - meta_delay - 500 )
        })
      } , meta_delay)
    })
  },


  play : function(files, options , chain) {
    if(typeof files == "string")
      files = [files];

    this.playlist = files;
    chain = chain || Function.prototype;
    var self = this;
    this._send("clear", function(){
      files.forEach(function(fileName , id){
        var cmd = id === 0 ? "add ": "enqueue ";
        self._send(cmd + fileName, function(err){

        });
      })
    });
  },

  _send : function(str, chain) {
    chain = once(chain || Function.prototype);

    // console.log('i send :' , str);

    var sock = net.connect(this.options.network, function(err){
      if(err)
        return chain(err);
      var body = "";

      sock.on("data", function(buf){
        body += buf;
      });

      sock.once("end", function(){
        //trim vlc verbosity
        body = body.replace(/status change:.*\r?\n/g, '');
        chain(null , body.trim());
      });

      sock.once("error", function(err){
        chain(err)
      });

      try{
        sock.write(str + "\r\n", function(){
          sock.end();
        });
      }catch (e){
        chain(e)
      }
    })
  },

  kill : function(chain) {
    this._send("stop", chain);
  },

});


module.exports = Remote;
