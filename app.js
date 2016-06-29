var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    phantom = require('phantom'),
    fs = require('fs');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
    // Dès qu'on reçoit un snapshot on récupère les données de l'image en base64 avant de renvoyer les données au client
    socket.on('new_snapshot', function (params) {
        phantom.create().then(function(ph) {
            ph.createPage().then(function(page) {
                page.property('viewportSize', {width: 1600, height: 1200}).then(function() {
                    page.open(params.url).then(function(status) {
                        page.renderBase64('PNG').then(function(data) {
                            var imgData = 'data:image/png;base64,'+data;
                            socket.broadcast.emit('new_snapshot', {imgData: imgData, description: params.description, url: params.url});
                            socket.emit('new_snapshot', {imgData: imgData, description: params.description, url: params.url});
                            ph.exit();
                        });
                    });
                });
            });
        });
    });
});

server.listen(8080);