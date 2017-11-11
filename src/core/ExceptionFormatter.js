getJasmineRequireObj().ExceptionFormatter = function(j$) {

  function ExceptionFormatter(options) {
    var jasmineFile = (options && options.jasmineFile) || j$.util.jasmineFile();
    this.message = function(error) {
      var message = '';

      if (error.name && error.message) {
        message += error.name + ': ' + error.message;
      } else {
        message += error.toString() + ' thrown';
      }

      if (error.fileName || error.sourceURL) {
        message += ' in ' + (error.fileName || error.sourceURL);
      }

      if (error.line || error.lineNumber) {
        message += ' (line ' + (error.line || error.lineNumber) + ')';
      }

      return message;
    };

    this.stack = function(error) {
      if (!error || !error.stack) {
        return null;
      }

      var stackTrace = new j$.StackTraceParser().parse(error.stack);
      var lines = filterJasmine(stackTrace.frames);

      if (stackTrace.message) {
        lines.unshift(stackTrace.message);
      }

      return lines.join('\n');
    };

    function filterJasmine(frames) {
      var result = [], jasmineMarker = '    at <Jasmine>';
 
      frames.forEach(function(frame) {
        if (frame.file && frame.file === jasmineFile) {
          if (result[result.length - 1] !== jasmineMarker) {
            result.push(jasmineMarker);
          }
        } else {
          result.push(frame.raw);
        }
      });
 
      return result;
    }
  }

  return ExceptionFormatter;
};
