define(['./Board.js'], function ( Board ) {
  /**
   * Create Noduini object for handling general access
   * @param object options
   */
  function Noduino(options, NoduinoClientFacade, Logger) {
    // TODO: What is this ridiculous pattern? A singleton or something?
    if (false === (this instanceof Noduino)) {
      return new Noduino(options); }

    this.clientFacade            = new NoduinoClientFacade(options)
    this.logger       = new Logger(options);
    this.options      = options;
    this.options.type = this.clientFacade.connection;
    this.connected    = false;

    this.setLoggerOptions();
    this.setLogger();
  };

  Noduino.prototype.setLoggerOptions = function() {
    if (!this.options.logger) {
      return; }
    for (var n in this.options.logger) {
      this.logger.setOption(n, this.options.logger[n]); }
  };

  Noduino.prototype.setLogger = function() {
    this.clientFacade.setLogger(this.logger);
  };

  Noduino.prototype.log = function(level, msg) {
    this.clientFacade.log(level, msg);
  }

  Noduino.prototype.connect = function(options, callback) {
    this.log('connecting to noduino');

    if ( !callback ) {
      callback = options;
      options = {};
    }
    var that = this;
    this.clientFacade.connect( options, function( err, board ) {
      if ( err ) {
        return callback( err );
      }
      that.connected = true;
      callback( null, new Board( options, that.clientFacade ) );
    });
  }

  return Noduino;
});