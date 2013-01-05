/**
 * Board.js – Arduino Board Controller
 * This file is part of noduino (c) 2012 Sebastian Müller <c@semu.mp>
 *
 * @package     noduino
 * @author      Sebastian Müller <c@semu.mp>
 * @license     MIT License – http://www.opensource.org/licenses/mit-license.php
 * @url         https://github.com/semu/noduino
 */

define(['./LED.js', './Button.js', './AnalogInput.js',  './DigitalOutput.js', './Speaker.js'], function(LEDObj, ButtonObj, AnalogInputObj, DigitalOutObj, SpeakerObj) {

  /**
   * Create Board
   * @param object options set options like pin
   * @param object Connector switch between Serial or Socket mode
   */
  function Board( options, clientFacade ) {
    if ( false === ( this instanceof Board ) ) {
      return new Board(options);
    }

    this.clientFacade = clientFacade;
    this.options      = options;
    this.pinMapping   = {};
  };

  /**
   * Write to digital output on pin
   * @param integer pin pin number
   * @param string mod pin mode
   * @param function callback
   */
  Board.prototype.digitalWrite = function(pin, mode, callback) {
    this.clientFacade.digitalWrite(pin, mode, function(err) {
      if (err) { return next(err); }
    });
  };

  /**
   * Check if pin is already in use
   * @param integer pin pin number
   * @return boolean
   */
  Board.prototype.pinAvailable = function(pin) {
    return (this.pinMapping[pin] ? true : false);
  };

  /**
   * Get type of pin on board
   * @param integer pin pin number
   * @return mixed
   */
  Board.prototype.pinType = function(pin) {
    return this.pinMapping[pin];
  }

  /**
   * Create AnalogInput object on board
   * @param object options
   * @param function callback
   */
  Board.prototype.withAnalogInput = function(options, next) {
    this.with(this.clientFacade.TYPE_ANALOGIN, options, next);
  }

  /**
   * Create Button object on board
   * @param object options
   * @param function callback
   */
  Board.prototype.withButton = function(options, next) {
    this.with(this.clientFacade.TYPE_BUTTON, options, next);
  };

  /**
   * Create DigitalOutput object on board
   * @param object options
   * @param function callback
   */
  Board.prototype.withDigitalOutput = function(options, next) {
    this.with(this.clientFacade.TYPE_DIGITALOUT, options, next);
  };

  /**
   * Create LED object on board.
   * @param object options
   * @returns {LED} LED instance.
   */
  Board.prototype.getLed = function( options ) {
    var pin = options.pin;
    this.clientFacade.setOutputPin( pin );
    return new LEDObj( { "pin": pin, "type": this.clientFacade.TYPE_LED }, this.clientFacade );
  };

  /**
   * Create Speaker object on board
   * @param object options
   * @param function callback
   */
  Board.prototype.withSpeaker = function(options, next) {
    this.with(this.clientFacade.TYPE_SPEAKER, options, next);
  };

  /**
   * Handle object creation
   * @param string what object type
   * @param object options
   * @param function callback
   */
  Board.prototype.with = function(what, options, next) {
    if (this.pinAvailable(options.pin)) {
      return next(new Error('PIN already in use')); }

    this.pinMapping[options.pin] = what;

    var clientFacade = this.clientFacade;

    switch ( what ) {

      case clientFacade.TYPE_BUTTON:
        clientFacade.addButtonInputHandler(options.pin, function(err, pin) {
          if (err) { return next(err); }
          next(null, new ButtonObj({"pin": pin, "type": what}, clientFacade));
        });
        break;

      case clientFacade.TYPE_ANALOGIN:
        clientFacade.addAnalogInputHandler(options.pin, function(err, pin) {
          if (err) { return next(err); }
          next(null, new AnalogInputObj({"pin": pin, "type": what}, clientFacade));
        });
        break;

      /*
      // TODO: Doesn't look like this methods is supported by NoduinoClientFacade (formerly Noduino.Socket).
      case clientFacade.TYPE_DIGITALOUT:
        clientFacade.withDigitalOutput(options.pin, function(err, pin) {
          if (err) { return next(err); }
          next(null, new DigitalOut({"pin": pin, "type": what}, clientFacade));
        });
        break;

      // TODO: Doesn't look like this method is supported by NoduinoClientFacade (formerly Noduino.Socket).
      case clientFacade.TYPE_SPEAKER:
        clientFacade.withDigitalOut(options.pin, function(err, pin) {
          if (err) { return next(err); }
          next(null, new SpeakerObj({"pin": pin, "type": what}, clientFacade));
        });
      break;
      */
    }
  }

  return Board;
});
