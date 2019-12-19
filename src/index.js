const express = require('express')
const path = require('path')
const http = require('http')
const socket = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socket(server)
const Filter = require('bad-words')

const port = process.env.PORT || 3000
const publicFileDir = path.join(__dirname,'../public')

app.use(express.static(publicFileDir))

app.get('' , (req, res) => {
    res.render('index')
})

io.on('connection', (socket) => {
    console.log("New WebSocket Connection")

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options})

        if( error ) {
            return callback(error)
        }

        socket.join(user.room)
        
        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`),)
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const filter = new Filter()
        if( filter.isProfane(msg) )
        {
            return callback('Bad words are not allowed!')
        }

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username,msg))
        callback('Delivered!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage("Admin",`${user.username} Has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
    
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback('Location has been shared!')
    })
})

server.listen(port, () => {
    console.log('server run at port ' + port)
})