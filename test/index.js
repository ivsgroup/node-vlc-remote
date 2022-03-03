"use strict";

var expect = require("expect.js");
var net    = require("net");


var Remote = require('../remote');


describe("Initial test suite", function() {
  var body = "";
  var vlc = net.createServer(function(sock) {
    sock.on("data", function(buf) {
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


  it("should prepare a vlc server mock", async function() {
    await vlc.listen(8088);
  });

  var remote = new Remote();

  it("start testing a dummy play", async function() {
    await remote.play("test.mp4");
    expect(vlc.drain()).to.equal('clear\r\nadd test.mp4\r\n');
  });

  it("plays a file once", async function() {
    await remote.playonce("testonce.mp4");
    expect(vlc.drain()).to.equal('add testonce.mp4\r\nget_length\r\nget_length\r\nclear\r\nadd test.mp4\r\n');
  });

  it("tests a playlist", async function() {
    await remote.play(["test.mp4", "test1.mp4", "test2.mp4"]);
    expect(vlc.drain()).to.equal('clear\r\nadd test.mp4\r\nenqueue test1.mp4\r\nenqueue test2.mp4\r\n');
  });

  it("enques a simple file", async function() {
    await remote.enqueue("test.mp4");
    expect(vlc.drain()).to.equal('enqueue test.mp4\r\n');
  });


  it("plays nothing", async function() {
    await remote.play([]);
    expect(vlc.drain()).to.equal('stop\r\n');
  });

  it("gets length", async function() {
    await remote.getLength();
    expect(vlc.drain()).to.equal('get_length\r\nget_length\r\n');
  });

  it("tests dummy callback", async function() {
    await remote.pause();
    expect(vlc.drain()).to.equal('pause\r\n');
  });

  it("tests dummy callback", async function() {
    await remote.stop(),
    expect(vlc.drain()).to.equal('stop\r\n');
  });

  it("tests dummy callback", async function() {
    await remote.info();
    expect(vlc.drain()).to.equal('info\r\n');
  });

  it("Cannot connect as there is no server", async function() {
    try {
      var remote = new Remote(8081);
      await remote.play("test.mp4");
      expect().to.fail("Never here");
    } catch(err) {
      expect(err.code).to.match(/ECONNREFUSED/);
    }
  });

});
