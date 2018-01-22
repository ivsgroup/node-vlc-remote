"use strict";

var expect = require("expect.js");
var net    = require("net");



var Remote = require('../');


describe("Initial test suite", function() {
  var body = "";
  var vlc = net.createServer(function(sock) {
    sock.on("data", function(buf){
      //when someone asks for length, answer is 1
      if(buf == "get_length\r\nget_length\r\n")
        sock.end("0\r\n1");
      if(buf == "quit\r\n")
        sock.destroy();
      body += buf;
    });
  });
  vlc.drain = function() {
    var tmp = body;
    body = "";
    return tmp;
  };



  it("should prepare a vlc server mock", function(chain) {
    vlc.listen(8088, function(err){
      console.log(this.listening);
      chain(err);
    });
  });

  var remote = new Remote();

  it("start testing a dummy play", function(done) {
    remote.play("test.mp4", (err) => {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('clear\r\nadd test.mp4\r\n');
      done();
    });
  });

  it("plays a file once", function(done){
    remote.playonce("testonce.mp4", (err) => {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('add testonce.mp4\r\nget_length\r\nget_length\r\nclear\r\nadd test.mp4\r\n');
      done();
    });
  });

  it("tests a playlist", function(done){
    remote.play(["test.mp4", "test1.mp4", "test2.mp4"], (err) => {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('clear\r\nadd test.mp4\r\nenqueue test1.mp4\r\nenqueue test2.mp4\r\n');
      done();
    });
  })

  it("enques a simple file", function(done) {
    remote.enqueue("test.mp4", (err)=> {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('enqueue test.mp4\r\n');
      done();
    });
  });


  it("plays nothing", function(done) {
    remote.play([], (err) => {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('stop\r\n');
      done();
    });
  });

  it("gets length", function(done) {
    remote.getLength((err) => {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('get_length\r\nget_length\r\n');
      done();
    });
  });

  it("tests dummy callback", function(done) {
    remote.pause((err)=>{
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('pause\r\n');
      done();
    });
  });

  it("tests dummy callback", function(done){
    remote.stop((err)=> {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('stop\r\n');
      done();
    });
  });

  it("tests dummy callback", function(done){
    remote.info((err)=> {
      expect(err).to.be.undefined;
      expect(vlc.drain()).to.equal('info\r\n');
      done();
    });
  });

  it("Cannot connect as there is no server", function(done) {
    var remote = new Remote(8081);
    remote.play("test.mp4", (err)=>{
      expect(err).to.be.ok();
      done();
    });
  });

});