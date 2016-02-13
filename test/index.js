"use strict";

var expect = require("expect.js");
var net    = require("net");



var Remote = require('../');


describe("Initial test suite", function(){

  var body = "", vlc = net.createServer(function(sock){
    sock.on("data", function(buf){
        //when someone asks for length, answer is 1
      if(buf == "get_length\r\nget_length\r\n") 
        sock.end("0\r\n1");
      if(buf == "quit\r\n") 
        sock.destroy();

      body += buf;
    });
    
  });
  vlc.drain = function(){ var tmp = body; body = ""; return tmp; };



  it("should prepare a vlc server mock", function(chain){
    vlc.listen(8088, chain)
  });

  var remote = new Remote();

  it("start testing a dummy play", function(chain) {
    remote.play("test.mp4", function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('clear\r\nadd test.mp4\r\n');
      chain();
    });
  });


  it("plays a file once", function(chain){
    remote.playonce("testonce.mp4", function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('add testonce.mp4\r\nget_length\r\nget_length\r\nclear\r\nadd test.mp4\r\n');
      chain();
    });
  });


  it("tests a playlist", function(chain){
    remote.play(["test.mp4", "test1.mp4", "test2.mp4"], function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('clear\r\nadd test.mp4\r\nenqueue \'test1.mp4\'\r\nenqueue \'test2.mp4\'\r\n');
      chain();
    });
  });


  it("enques a simple file", function(chain){
    remote.enqueue("test.mp4", function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('enqueue \'test.mp4\'\r\n');
      chain();
    });
  });



  it("plays nothing", function(chain){
    remote.play([], function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('stop\r\n');
      chain();
    });
  });


  it("gets length", function(chain){
    remote.getLength(function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('get_length\r\nget_length\r\n');
      chain();
    });
  });

  it("tests dummy callback", function(chain){
    remote.pause(function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('pause\r\n');
      chain();
    });
  });

  it("tests dummy callback", function(chain){
    remote.stop(function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('stop\r\n');
      chain();
    });
  });

  it("tests dummy callback", function(chain){
    remote.info(function(err){
      expect(err).not.to.be.ok();
      expect(vlc.drain()).to.equal('info\r\n');
      chain();
    });
  });

  it("Cannot connect as there is no server", function(chain) {
    var remote = new Remote(8081);
    remote.play("test.mp4", function(err){
      expect(err).to.be.ok();
      chain();
    });
  });





});