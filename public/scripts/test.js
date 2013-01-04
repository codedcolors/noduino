require(["jquery"], function($) {
  $(document).ready(function(e) {

    // Listen for button click.
    $('#e2-buttonConnect').click(function(e) {
      e.preventDefault();

      $('#e2-exampleConnection .alert').addClass('hide');
      $('#e2-exampleConnection .alert-info').removeClass('hide');
      $('#e2-exampleConnection .alert-info').html('Trying to connect to your Arduino…');

      var that = this;
      require(['scripts/libs/Noduino.js', 'scripts/libs/Noduino.Socket.js', 'scripts/libs/Logger.js'], function(NoduinoObj, Connector, Logger) {
        var Noduino = new NoduinoObj({debug: false, host: 'http://localhost:8090'}, Connector, Logger);
        Noduino.connect(function(err, board) {
          $('#e2-exampleConnection .alert').addClass('hide');
          if (err) {
            $('.board-error').removeClass('hide');
            console.log("Error connecting to board.");
          } else {
            console.log("Success connecting to board.");

            // Start blinking.
            var that = this;
            if (!that.led) {
              board.withLED({pin: 13}, function(err, LED) {
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
        });
      });

    });

  });
});