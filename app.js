var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    phantom = require('phantom'),
    fs = require('fs');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function() {
        socket.broadcast.emit('nouveau_client');
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
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