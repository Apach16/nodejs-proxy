const cluster = require('cluster');
const http = require('http');
const fs = require('fs');
const numCPUs = require('os').cpus().length;
var url = require("url");

const hostname = '127.0.0.1';
const port = 8000;

function format_date(date) {
  return date < 10 ? "0" + date : date;
}

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  var server = http.createServer((req, res) => {
    var method = req.method;
    var ip = req.connection.remoteAddress;
    var url_info  = url.parse(req.url);
    var options = {
      hostname: url_info.hostname,
      port: url_info.port,
      method: method,
      path: url_info.path,
      headers: req.headers
    };
    var proxy_req = http.request(options);
    proxy_req.on('response', function(proxy_res) {
      proxy_res.on('data', function(chunk) {
        res.write(chunk, 'binary');
      });
      proxy_res.on('end', function() {
        res.end();
      });
      res.writeHead(proxy_res.statusCode, proxy_res.headers);
    });
    req.on('data', function(chunk) {
      proxy_req.write(chunk, 'binary');
    });
    req.on('end', function() {
      proxy_req.end();
    });
    // формируем время и дату
    var date = new Date();
    var curren_date = date.getFullYear() + '-' +
       format_date(date.getMonth() + 1) + '-' +
       format_date(date.getDate());
    var current_time = format_date(date.getHours()) + ':' +
       format_date(date.getMinutes()) + ':' +
       format_date(date.getSeconds());
    // собираем все данные в одну строку
    var data = '[' + curren_date + ' ' + current_time + '] ' + ip +
      ' ' + method + ' ' + req.url;
    fs.appendFile('log.txt', data + '\n', function(err) {
      if (err) {
        return console.log(err);
      } else {
        console.log(`${data} saved!`);
      }
    });
  });

  server.listen(port, hostname, () => {
    console.log('Starting process ' + process.pid);
  });

}
