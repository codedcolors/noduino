/**
 * The BoardToClientBridge class is for client-side use.
 * It is used to bridge the Arduino board to the server-side
 * code through socket.io messsage-broadcasting.
 *
 * @name Noduino.Socket
 * @namespace
 */
define(function(require, exports, module) {

  function BoardToClientBridge( options ) {
    // TODO: What the heck is this?
    if ( !( this instanceof BoardToClientBridge ) ) {
      return new BoardToClientBridge( options );
    }

    this.options  = options;
    this.logger   = null;
    this.socket_  = null;
    this.callbacksForMessage_ = {};

    this._init();
  };

  BoardToClientBridge.prototype.setLogger = function(Logger) {
    this.logger = Logger;
  };

  BoardToClientBridge.prototype.log = function(level, msg) {
    return this.logger.msg(level, msg);
  };

  // TODO: These types of constants are referred to by
  // this class, Board.js, and Noduino.Serial.js.
  // They belong in an external constants file.
  // This will require its own test battery, for each constant.
  BoardToClientBridge.prototype.connection  = 'serial';
  BoardToClientBridge.prototype.HIGH        = '255';
  BoardToClientBridge.prototype.LOW         = '000';
  BoardToClientBridge.prototype.MODE_OUT    = 'out';
  BoardToClientBridge.prototype.MODE_IN     = 'in';
  BoardToClientBridge.prototype.DIGITAL_ON    = '1';
  BoardToClientBridge.prototype.DIGITAL_OFF   = '0';
  BoardToClientBridge.prototype.TYPE_LED      = 0x31;
  BoardToClientBridge.prototype.TYPE_BUTTON   = 0x32;
  BoardToClientBridge.prototype.TYPE_ANALOGIN = 0x33;
  BoardToClientBridge.prototype.TYPE_DIGITALOUT = 0x34;
  BoardToClientBridge.prototype.TYPE_SPEAKER = 0x35;

  BoardToClientBridge.prototype.MESSAGES = {};
  BoardToClientBridge.prototype.MESSAGES.BOARD_CONNECT = 'board.connect';

  /**
   * TODO: This is used by classes such as DigitalOutput,
   * but this is obviously a retarded method.
   * We need to remove it and all references to it.
   */
  BoardToClientBridge.prototype.current = function() {
    return this;
  };

  /**
   * When we get a BOARD_CONNECT message from socket.io,
   * call the BOARD_CONNECT callbacks.
   */
  BoardToClientBridge.prototype._init = function() {
    // Connect to socket.io through specified port.
    this.socket_ = io.connect( this.options.host );

    var that  = this;
    this.socket_.on( 'response', function( payload ) {

      var message = payload.msg;
      if ( message == BoardToClientBridge.prototype.MESSAGES.BOARD_CONNECT ) {

        var callbacks = that.callbacksForMessage_[ message ];
        for ( var callbackIndex = 0; callbackIndex < callbacks.length; callbackIndex++ ) {
          var callback = callbacks[ callbackIndex ];
          if ( callback ) {
            // If callback exists, call and remove callback.
            // Why are we deleting data if it's ready?
            if ( payload.response == 'ready' ) {
              payload = null;
            }
            var board = function( options ){};
            callback( payload, board );
            delete that.callbacksForMessage_[ message ][ callbackIndex ];
          }
        }

      }

    });
  };

  /**
   * Tell socket.io that we're ready to handle a board connection.
   *
   * @param {Function} optionalCallback TODO
   * @param {Function} nextCallback TODO
   */
  BoardToClientBridge.prototype.connect = function( optionalCallback, nextCallback ) {
    // Why do we assign options to next when next doesn't exist?
    // Are we doing some sort of recursion maybe? Or queueing?
    if ( !nextCallback ) {
      nextCallback = optionalCallback;
    }

    var connectionCallbacks = this.callbacksForMessage_[ BoardToClientBridge.prototype.MESSAGES.BOARD_CONNECT ] || [];
    connectionCallbacks.push( nextCallback );
    this.callbacksForMessage_[ BoardToClientBridge.prototype.MESSAGES.BOARD_CONNECT ] = connectionCallbacks;

    this.log('sending command through socket');
    this._emit( BoardToClientBridge.prototype.MESSAGES.BOARD_CONNECT );
  }

  /**
   * Send a message, intended to be received by server-side code.
   *
   * @param {string} type An identifier for the type of message.
   * @param {object} payload Any associated data with the messsage.
   */
  BoardToClientBridge.prototype._emit = function( type, payload ) {
    this.log('socket-write', type + ': ' + JSON.stringify( payload ));
    this.socket_.emit( type, payload );
  }

  /**
   * Formats a value for use with the Arduino board.
   * This needs some clarification.
   * TODO: This method is duplicated by Board.js and Noduino.Serial.js
   * and should be refactored out.
   *
   * @param {string} val A value.
   */
  BoardToClientBridge.prototype._formatValForArduino = function( val ) {
    // Pad the input value and extract the last 3 values from the string.
    return ( "000" + val ).substr( -3 );
  }

  /**
   * Formats a pin for use with the Arduino board.
   * This needs some clarification.
   * TODO: This method is duplicated by Board.js and Noduino.Serial.js
   * and should be refactored out.
   *
   * @param {string} pin A pin.
   */
  BoardToClientBridge.prototype._formatPinForArduino = function ( pin ) {
    // Pad the input value and extract the last 2 values from the string.
    return ( "00" + pin ).substr( -2 );
  };






  BoardToClientBridge.prototype.withLED = function( pin, handler ) {
    this._setPinMode( pin, this.MODE_OUT );
    handler( null, pin );
  };

  BoardToClientBridge.prototype.withButton = function( pin, next ) {
    this._setPinMode( pin, this.MODE_IN );
    next(null, pin);
  };

  BoardToClientBridge.prototype.withAnalogIn = function( pin, next ) {
    this._setPinMode( pin, this.MODE_IN );
    next(null, pin);
  }

  /**
   *
   *
   * @param {number} pin The pin number.
   */
  BoardToClientBridge.prototype._setPinMode = function( pin, mode ) {
    pin = this._formatPinForArduino( pin );
    var val = ( mode == this.MODE_OUT ) ? this._formatValForArduino( 1 ) : this._formatValForArduino( 0 );
    this.log('info', 'set pin ' + pin + ' mode to ' + val);
    this.write( '00' + pin + val );
  };

  BoardToClientBridge.prototype.write = function( commandCode, callback) {
    this.log('info', 'writing: ' + commandCode);
    this._emit( 'serial', {
      'type': 'write',
      'write': commandCode,
      'id': this.socket_.socket.sessionid
    } );
  };





  BoardToClientBridge.prototype.digitalWrite = function( pin, val, next ) {
    pin = this._formatPinForArduino(pin);
    val = this._formatValForArduino(val);
    this.log('info', 'analogWrite to pin ' + pin + ': ' + val);
    this.write('03' + pin + val);

    if ( next ) {
      next( null, pin );
    }
  };

  BoardToClientBridge.prototype.watchAnalogIn = function(AnalogInput) {
    var that = this;

    this.analogRead(AnalogInput.pin);
    this.socket_.on('response', function(data) {
      if (data.type == 'analogRead' && data.pin == AnalogInput.pin) {
        that.log('socket-read', JSON.stringify(data));
        var event = {pin: data.pin, value: data.value*1};
        if (event.pin == AnalogInput.pin) {
          AnalogInput.set(event.value);
        }
      }
    });
  }

  BoardToClientBridge.prototype.analogRead = function (pin) {
    this._emit('serial', {'type': 'analogRead', 'pin': this._formatPinForArduino(pin)});
  }

  BoardToClientBridge.prototype.digitalRead = function (pin) {
    this._emit('serial', {'type': 'digitalRead', 'pin': this._formatPinForArduino(pin)});
  }

  BoardToClientBridge.prototype.watchDigitalIn = function(DigitalIn) {
    var that = this;

    this.digitalRead(DigitalIn.pin);
    this.socket_.on('response', function(data) {
      if (data.type == 'digitalRead' && data.pin == DigitalIn.pin) {
        that.log('socket-read', JSON.stringify(data));

        if (data.value == 1) {
          DigitalIn.setOn(); }
        else {
          DigitalIn.setOff(); }
      }
    });
  }

  return BoardToClientBridge;
});

