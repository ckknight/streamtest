var Stream = require('stream');

var StreamTest = {
  versions: ['v1', 'v2'],
  // Node lt 0.10 streams
  v1: {
    readable: function v1Readable(options) {
      var stream = new Stream(options);
      stream.readable = true;
      return stream;
    },
    fromObjects: function v1FromObjects(objects, timeout) {
      var stream = StreamTest.v1.readable();
      setTimeout(function() {
        StreamTest.v1.__emitToStream(stream, objects, timeout);
      }, timeout || 0);
      return stream;
    },
    fromErroredObjects: function v1FromObjects(err, objects, timeout) {
      var stream = StreamTest.v1.readable();
      setTimeout(function() {
        StreamTest.v1.__emitToStream(stream, objects, timeout, function() {
          stream.emit('error', err);
        });
      }, timeout || 0);
      return stream;
    },
    fromChunks: function v1FromChunks() {
      return StreamTest.v1.fromObjects.apply(this, arguments);
    },
    fromErroredChunks: function v1FromChunks() {
      return StreamTest.v1.fromErroredObjects.apply(this, arguments);
    },
    __emitToStream: function v1EmitToStream(stream, chunks, timeout, endcb) {
      if(!chunks.length) {
        if(endcb) {
          endcb();
        }
        stream.emit('end');
      } else {
        setTimeout(function() {
          stream.emit('data', chunks.shift());
          StreamTest.v1.__emitToStream(stream, chunks, timeout, endcb);
        }, timeout || 0);
      }
    },
    writable: function v1Writable(options) {
      var stream = new Stream(options);
      stream.writable = true;
      return stream;
    },
    toObjects: function v1ToObjects(cb) {
      var objs = [];
      var stream = StreamTest.v1.writable();
      stream.write = function(obj) {
        objs.push(obj);
      };
      stream.end = function() {
        cb(null, objs);
      };
      stream.on('error', function(err) {
        cb(err);
      });
      return stream;
    },
    toChunks: function v1ToChunks(cb) {
      var chunks = [];
      var stream = StreamTest.v1.writable();
      stream.write = function(chunk, encoding) {
        chunks.push(Buffer(chunk));
      };
      stream.end = function() {
        cb(null, chunks);
      };
      stream.on('error', function(err) {
        cb(err);
      });
      return stream;
    },
    toText: function v1ToText(cb) {
      return StreamTest.v1.toChunks(function(err, chunks) {
        if(err) {
          return cb(err);
        }
        cb(null, Buffer.concat(chunks).toString())
      });
    }
  },

  // Node gte 0.10 streams
  v2: {
    readable: function v2Readable(options) {
      var stream = new Stream.Readable(options);
      return stream;
    },
    fromObjects: function v2FromObjects(objects, timeout) {
      var stream = StreamTest.v2.readable({objectMode: true});
      stream._read = function() {
        var object = null;
        if(objects.length) {
          object = objects.shift();
        }
        setTimeout(function() {
          stream.push(object);
        }, timeout);
      };
      return stream;
    },
    fromErroredObjects: function v1FromErroredObjects(err, objects, timeout) {
      var stream = StreamTest.v2.readable({objectMode: true});
      stream._read = function() {
        var object = null;
        if(objects.length) {
          object = objects.shift();
        } else {
          setTimeout(function() {
            stream.emit('error', err);
          }, timeout);
        }
        setTimeout(function() {
          stream.push(object);
        }, timeout);
      };
      return stream;
    },
    fromChunks: function v2FromChunks(chunks, timeout) {
      var stream = StreamTest.v2.readable();
      stream._read = function() {
        var chunk = null;
        if(chunks.length) {
          chunk = chunks.shift();
        }
        setTimeout(function() {
          stream.push(chunk);
        }, timeout);
      };
      return stream;
    },
    fromErroredChunks: function v2FromChunks(err, chunks, timeout) {
      var stream = StreamTest.v2.readable();
      stream._read = function() {
        var chunk = null;
        if(chunks.length) {
          chunk = chunks.shift();
        } else {
          setTimeout(function() {
            stream.emit('error', err);
          }, timeout);
        }
        setTimeout(function() {
          stream.push(chunk);
        }, timeout);
      };
      return stream;
    },
    writable: function v2Writable(options) {
      var stream = new Stream.Writable(options);
      return stream;
    },
    toObjects: function v2ToObjects(cb) {
      var stream = new StreamTest.v2.writable({objectMode: true});
      var objs = [];
      stream._write = function (obj, unused, done) {
        objs.push(obj);
        done();
      };
      stream.on('finish', function() {
        cb(null, objs);
      });
      stream.on('error', function(err) {
        cb(err);
      });
      return stream;
    },
    toChunks: function v2ToChunks(cb) {
      var stream = new StreamTest.v2.writable({objectMode: true});
      var chunks = [];
      stream._write = function (chunk, encoding, done) {
        if(encoding && 'buffer' != encoding) {
          chunk = Buffer(chunk.toString(encoding))
        }
        chunks.push(Buffer(chunk));
        done();
      };
      stream.on('finish', function() {
        cb(null, chunks);
      });
      stream.on('error', function(err) {
        cb(err);
      });
      return stream;
    },
    toText: function v2ToText(cb) {
      return StreamTest.v2.toChunks(function(err, chunks) {
        if(err) {
          return cb(err);
        }
        cb(null, Buffer.concat(chunks).toString())
      });
    }
  }
};

module.exports = StreamTest;

