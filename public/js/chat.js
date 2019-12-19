const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    var elem = document.getElementById('messages');
    elem.scrollTop = elem.scrollHeight;
}

socket.on('message', (msg) => {
    var sender = decodeURIComponent(window.location.search.match(/(\?|&)username\=([^&]*)/)[2]).toLowerCase()
    //console.log(msg)
    var styleClass = 'message__receiver'
    if(msg.username == sender) {
        styleClass = 'message__sender'
    }
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a'),
        class: styleClass
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    //console.log(url)
    var sender = decodeURIComponent(window.location.search.match(/(\?|&)username\=([^&]*)/)[2]).toLowerCase()
    
    var styleClass = 'message__receiver'
    if(url.username == sender) {
        styleClass = 'message__sender'
    }
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a'),
        class: styleClass
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) =>{
    
    e.preventDefault()
    
    $messageFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value
    
    socket.emit('sendMessage', msg, (error) => {
        
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            return console.log(error)
        }
        console.log('Message was delivered...')
    })
})

$sendLocationButton.addEventListener('click', () => {
    
    $sendLocationButton.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation) {
        return alert('Location not supported')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },(msg) => {
            console.log(msg)
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})