// Copyright Guilherme Farias. and other Contributors
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

module.exports = function(accessToken) {
	var q = require('q');
    var https = require('https');
    var query = require('querystring');
    var host = 'api.instagram.com';
    var port = 443;

    function call(method, path, params, callback) {
        var req;
        var data = null;
        var options;

        if(!params){
			params = {};
        }

        params.access_token = accessToken;

        options = {
            host: host,
            port: port,
            method: method,
            path: '/v1' + path + (method === 'GET' || method === 'DELETE' ? '?' + query.stringify(params) : ''),
            headers: {}
        };

        if (method !== 'GET' && method !== 'DELETE') {
            data = query.stringify(params);
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            options.headers['Content-Length'] = data.length;
        }

        req = https.request(options, function(res) {
            var body = '';

            res.setEncoding('utf8');

            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {
                var result;
                var limit = parseInt(res.headers['x-ratelimit-limit'], 10) || 0;
                var remaining = parseInt(res.headers['x-ratelimit-remaining'], 10) || 0;

                try {
                    result = JSON.parse(body);
                } catch (err) {
                    callback(err, body);
                    return;
                }

                callback(null, result, remaining, limit);
            });
        });

        req.on('error', function(err) {
            return callback(err);
        });

        if (data !== null) {
            req.write(data);
        }

        req.end();
    };

    function userSelf() {
    	var deferred = q.defer();
        var params = {};

        call('GET', '/users/self', params, function(err, result, remaining, limit) {
            if (err) {
            	deferred.reject(err);
            	return;
            }

            if (result && result.meta && result.meta.code === 200) {
                return deferred.resolve(result.data, {}, remaining, limit);
            } else if(result && result.meta) {
                deferred.reject(result.meta);
            } else {
            	deferred.reject(result);
            }
        });

        return deferred.promise;
    };

    return {
    	userSelf: userSelf
    };
};