/**
 * srv.app.js – Handling HTTP:80 Requests
 * This file is part of noduino (c) 2012 Sebastian Müller <c@semu.mp>
 *
 * @package     noduino
 * @author      Sebastian Müller <c@semu.mp>
 * @license     MIT License – http://www.opensource.org/licenses/mit-license.php
 * @url         https://github.com/semu/noduino
 */

var express = require("express");
var connect = require("connect");

define(['module', 'path', 'fs'], function (module, path, fs) {
  var name = 'localhost';
  var port = 8080;
  var path = './';

  var srv = express.createServer();
  srv.set('views', path + '/views');
  srv.set('view engine', 'jade');
  srv.set('view cache', false);

  srv.configure(function() {
    srv.use(express.cookieParser());
    srv.use(express.logger(':method :url - :referrer'));
    srv.use(express.compiler({ src: path + '/public', enable: ['less'] }));
    srv.use(express.static( path + '/public'));
    srv.use(express.bodyParser());
  });

  srv.configure('development', function(){
    srv.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  srv.configure('production', function(){
    srv.use(express.errorHandler());
  });

  var router = express.createServer(connect.vhost(name, srv));
  router.use(express.cookieParser());
  router.listen(port);

  /**
   * Serve test page.
   */
  srv.all('/', function(req, res) {
    res.render('test', {active: 'home'});
  });

  return {'srv': srv, 'router': router};
});