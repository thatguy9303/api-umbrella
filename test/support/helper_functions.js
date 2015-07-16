'use strict';

require('../test_helper');

var _ = require('lodash'),
    execFile = require('child_process').execFile,
    path = require('path'),
    request = require('request');

_.merge(global.shared, {
  runCommand: function(command, callback) {
    var binPath = path.resolve(__dirname, '../../bin/api-umbrella');
    var overridesConfigPath = path.resolve(__dirname, '../config/.overrides.yml');
    execFile(binPath, [command], {
      env: _.merge({}, process.env, {
        'API_UMBRELLA_ROOT': process.env.API_UMBRELLA_ROOT,
        'API_UMBRELLA_CONFIG': overridesConfigPath,
      }),
    }, function(error, stdout, stderr) {
      if(error) {
        return callback('Error running api-umbrella command: ' + error + ' (STDOUT: ' + stdout + ', STDERR: ' + stderr + ')');
      }

      callback();
    });
  },

  chunkedRequestDetails: function(options, callback) {
    request(options).on('response', function(response) {
      var bodyString = '';
      var chunks = [];
      var stringChunks = [];
      var chunkTimeGaps = [];
      var lastChunkTime;

      response.on('data', function(chunk) {
        bodyString += chunk.toString();
        chunks.push(chunk);
        stringChunks.push(chunk.toString());

        if(lastChunkTime) {
          var gap = Date.now() - lastChunkTime;
          chunkTimeGaps.push(gap);
        }

        lastChunkTime = Date.now();
      });

      response.on('end', function() {
        callback(response, {
          bodyString: bodyString,
          chunks: chunks,
          stringChunks: stringChunks,
          chunkTimeGaps: chunkTimeGaps,
        });
      });
    });
  },
});
