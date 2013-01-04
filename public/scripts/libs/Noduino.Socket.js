define(function(require, exports, module) {

  function SocketNoduino (options) {
    if ( !( this instanceof SocketNoduino ) ) {
      return new SocketNoduino( options );
    }

    this.options  = options;
    this.logger   = null;
    this.io       = null;
    this.callbacksForMessage = {};

    // Get started.
    this.checkSocket_();
  };

  SocketNoduino.prototype.setLogger = function(Logger) {
    this.logger = Logger;
  };

  SocketNoduino.prototype.log = function(level, msg) {
    return this.logger.msg(level, msg);
  };

  // Needs refactoring.
  SocketNoduino.prototype.connection  = 'serial';
  SocketNoduino.prototype.HIGH        = '255';
  SocketNoduino.prototype.LOW         = '000';
  SocketNoduino.prototype.MODE_OUT    = 'out';
  SocketNoduino.prototype.MODE_IN     = 'in';
  SocketNoduino.prototype.DIGITAL_ON    = '1';
  SocketNoduino.prototype.DIGITAL_OFF   = '0';
  SocketNoduino.prototype.TYPE_LED      = 0x31;
  SocketNoduino.prototype.TYPE_BUTTON   = 0x32;
  SocketNoduino.prototype.TYPE_ANALOGIN = 0x33;
  SocketNoduino.prototype.TYPE_DIGITALOUT = 0x34;
  SocketNoduino.prototype.TYPE_SPEAKER = 0x35;

  SocketNoduino.prototype.MESSAGES = {};
  SocketNoduino.prototype.MESSAGES.BOARD_CONNECT = 'board.connect';

  SocketNoduino.prototype.current = function() {
    return this;
  };

  SocketNoduino.prototype.checkSocket_ = function() {
    // What does this comment mean?
    /** This is Client code: This works in your web browser */
    // What is io?
    if (!this.io) {
      this.io = io.connect( this.options.host );
    }

    var that  = this;

    this.io.on('response', function(data) {
      var message = data.msg;
      if ( message == SocketNoduino.prototype.MESSAGES.BOARD_CONNECT ) {
        var callbacks = that.callbacksForMessage[ message ];
        for ( var callbackIndex = 0; callbackIndex < callbacks.length; callbackIndex++ ) {
          var callback = callbacks[ callbackIndex ];
          if ( callback ) {
            // If callback exists, call and remove callback.
            // Why are we deleting data if it's ready?
            if (data.response == 'ready') {
              data = null;
            }
            var board = function( options ){};
            callback( data, board );
            delete that.callbacksForMessage[ message ][ callbackIndex ];
          }
        }
      }
    });
  };

  SocketNoduino.prototype.connect = function( optionalCallback, nextCallback ) {
    // Why do we assign options to next when next doesn't exist?
    // Are we doing some sort of recursion maybe? Or queueing?
    if ( !nextCallback ) {
      nextCallback = optionalCallback;
    }

    var connectionCallbacks = this.callbacksForMessage[ SocketNoduino.prototype.MESSAGES.BOARD_CONNECT ] || [];
    connectionCallbacks.push( nextCallback );
    this.callbacksForMessage[ SocketNoduino.prototype.MESSAGES.BOARD_CONNECT ] = connectionCallbacks;

    this.log('sending command through socket');
    this.pushSocket_( SocketNoduino.prototype.MESSAGES.BOARD_CONNECT );

    return;
  }

  SocketNoduino.prototype.pushSocket_ = function(type, data) {
    this.log('socket-write', type + ': ' + JSON.stringify(data));
    this.io.emit( type, data );
  }








  SocketNoduino.prototype.write = function(cmd, callback) {
    this.log('info', 'writing: ' + cmd);
    this.pushSocket_('serial', {'type': 'write', 'write': cmd, 'id': this.io.socket.sessionid});
  };

  SocketNoduino.prototype.pinMode = function(pin, val) {
    pin = this.normalizePin(pin);
    val = (val == this.MODE_OUT ? this.normalizeVal(1) : this.normalizeVal(0));
    this.log('info', 'set pin ' + pin + ' mode to ' + val);

    this.write('00' + pin + val);
  };

  SocketNoduino.prototype.normalizeVal = function(val) {
    return ("000" + val).substr(-3);
  }

  SocketNoduino.prototype.normalizePin = function (pin) {
    return ("00" + pin).substr(-2);
  };

  SocketNoduino.prototype.withLED = function(pin, next) {
    this.pinMode(pin, this.MODE_OUT);
    next(null, pin);
  };

  SocketNoduino.prototype.withButton = function(pin, next) {
    this.pinMode(pin, this.MODE_IN);
    next(null, pin);
  };

  SocketNoduino.prototype.withAnalogIn = function(pin, next) {
    this.pinMode(pin, this.MODE_IN);
    next(null, pin);
  }

  SocketNoduino.prototype.digitalWrite = function(pin, val, next) {
    pin = this.normalizePin(pin);
    val = this.normalizeVal(val);
    this.log('info', 'analogWrite to pin ' + pin + ': ' + val);
    this.write('03' + pin + val);

    if (next) {
      next(null, pin); }
  };

  SocketNoduino.prototype.watchAnalogIn = function(AnalogInput) {
    var that = this;

    this.analogRead(AnalogInput.pin);
    this.io.on('response', function(data) {
      if (data.type == 'analogRead' && data.pin == AnalogInput.pin) {
        that.log('socket-read', JSON.stringify(data));
        var event = {pin: data.pin, value: data.value*1};
        if (event.pin == AnalogInput.pin) {
          AnalogInput.set(event.value);
        }
      }
    });
  }

  SocketNoduino.prototype.analogRead = function (pin) {
    this.pushSocket_('serial', {'type': 'analogRead', 'pin': this.normalizePin(pin)});
  }

  SocketNoduino.prototype.digitalRead = function (pin) {
    this.pushSocket_('serial', {'type': 'digitalRead', 'pin': this.normalizePin(pin)});
  }

  SocketNoduino.prototype.watchDigitalIn = function(DigitalIn) {
    var that = this;

    this.digitalRead(DigitalIn.pin);
    this.io.on('response', function(data) {
      if (data.type == 'digitalRead' && data.pin == DigitalIn.pin) {
        that.log('socket-read', JSON.stringify(data));

        if (data.value == 1) {
          DigitalIn.setOn(); }
        else {
          DigitalIn.setOff(); }
      }
    });
  }

  return SocketNoduino;
});

