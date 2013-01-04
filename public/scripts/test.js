require(["jquery"], function($) {

  var runTest = function() {
    $('#e2-exampleConnection .alert').addClass('hide');
    $('#e2-exampleConnection .alert-info').removeClass('hide');
    $('#e2-exampleConnection .alert-info').html('Trying to connect to your Arduino…');

    var that = this;
    require(
      ['scripts/libs/Noduino.js', 'scripts/libs/BoardToClientBridge.js', 'scripts/libs/Logger.js'],
      function( Noduino, BoardToClientBridge, Logger ) {
        var noduinoConnection = new Noduino({debug: false, host: 'http://localhost:8090'}, BoardToClientBridge, Logger);
        noduinoConnection.connect( getOnBoardConnectionCallback() );
    });
  }

  var getOnBoardConnectionCallback = function() {
    return function(err, board) {

      $('#e2-exampleConnection .alert').addClass('hide');

      if (err) {
        $('.board-error').removeClass('hide');
        console.log("Error connecting to board.");
      } else {

        console.log("Success connecting to board.");

        // Start blinking.
        var that = this;
        if (!that.led) {
          board.withLED( { pin: 13 }, function( err, LED ) {
            if (err) {
              $('.error').removeClass('hide');
              return console.log(err);
            }
            that.led = LED;
            that.led.blink(500);
            that.led.on('change', function(data) {
              if (data.mode == '000') {
                $('#e2-status').removeClass('label-success');
                $('#e2-status').html('OFF');
              } else {
                $('#e2-status').addClass('label-success');
                $('#e2-status').html('ON');
              }
            });
          });
        } else {
          that.led.blink(interval);
        }
      }
    }
  }

  $(document).ready(function(e) {

    // Listen for button click.
    $('#e2-buttonConnect').click(function(e) {
      e.preventDefault();
      runTest();
    });

    // Listen for space bar or enter press.
    $( document ).keypress( function(e) {
      var keyCode = e.keyCode;
      if ( keyCode == 32 || keyCode == 13 ) {
        runTest();
      }
    });

  });
});