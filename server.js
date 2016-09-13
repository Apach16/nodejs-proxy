const cluster = require('cluster');
const http = require('http');
const fs = require('fs');
const numCPUs = require('os').cpus().length;
var url = require("url");

const hostname = '127.0.0.1';
const port = 8000;

function format_date(date){
  return date < 10 ? ("0" + date) : date;
}

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  server = http.createServer((req, res) => {
    var method = req.method;
    var ip = req.connection.remoteAddress;
    var address = req.headers.host + req.url;
    var date = new Date;
    var curren_date = date.getFullYear() + '-'
      + format_date(date.getMonth() + 1) + '-'
      + format_date(date.getDate());
    var current_time = format_date(date.getHours()) + ':'
      + format_date(date.getMinutes()) + ':'
      + format_date(date.getSeconds());
    // собираем все данные в одну строку
    var data = '[' + curren_date + ' ' + current_time + ']' + ' ' + ip + ' ' + method + ' ' +  address;
    fs.appendFile('log.txt', data + '\n', function(err){
      if (err){
        return console.log(err);
      }else{
        console.log(`${data} saved!`);
      }
    });
    res.writeHead(200);
    res.write("Welcome! You process id is " + process.pid + "\n");
    res.end(`${data}\n`);
  });

  server.listen(port, hostname, () => {
    console.log('Starting process ' + process.pid);
  });

}
