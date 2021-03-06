const namespacesDiv = document.querySelector('.namespaces')
const roomList = document.querySelector('.room-list')
const messageForm = document.getElementById('user-input')
const newMessageInput = document.getElementById('user-message')
const messages = document.getElementById('messages')
const currRoomNumUsers = document.querySelector('.curr-room-num-users')
const currRoomText = document.querySelector('.curr-room-text')
const searchBox = document.getElementById('search-box')

const username = prompt('What is your username?')

const SOCKET_BASE_URL = 'http://localhost:8000'
const socket = io(SOCKET_BASE_URL, { query: { username } })

let nsSocket = null

socket.on('connect', () => {
  console.log(`${socket.id} connected!`)
})

const buildMsgHTML = msg => {
  const convertedDate = new Date(msg.time).toLocaleString()
  return `
    <li>
        <div class="user-image">
            <img src="${msg.avatar}" />
        </div>
        <div class="user-message">
            <div class="user-name-time">${msg.username} <span>${convertedDate}</span></div>
            <div class="message-text">${msg.text}</div>
        </div>
    </li>
  `
}

function joinRoom(roomTitle) {
  currRoomText.innerText = roomTitle
  nsSocket.emit('joinRoom', roomTitle)
  nsSocket.on('historyCatchUp', history => {
    history.forEach(msg => messages.innerHTML += buildMsgHTML(msg))
    messages.scrollTo(0, messages.scrollHeight)
  })
  nsSocket.on('updateMembersCount', count => {
    currRoomNumUsers.innerHTML = `${count} <span class="glyphicon glyphicon-user"></span>`
  })
  searchBox.removeEventListener('input', handleSearchBoxInputEvt)
  searchBox.addEventListener('input', handleSearchBoxInputEvt)
}

function joinNS(endpoint) {
  if (nsSocket) {
    nsSocket.close()
    messageForm.removeEventListener('submit', handleFormSubmit)
  }

  nsSocket = io(`${SOCKET_BASE_URL}${endpoint}`)
  
  nsSocket.on('nsRoomLoad', nsRooms => {
    roomList.innerHTML = ''
    nsRooms.forEach(room => {
      const glyph = room.privateRoom ? 'lock' : 'globe'
      roomList.innerHTML += `
        <li class="room" data-roomtitle="${room.roomTitle}">
          <span class="glyphicon glyphicon-${glyph}"></span>${room.roomTitle}
        </li>    
      `
    })
    const topRoom = document.querySelector('.room')
    const topRoomTitle = topRoom.innerText
    joinRoom(topRoomTitle)
  })

  nsSocket.on('messageToClients', msg => messages.innerHTML += buildMsgHTML(msg)) 

  messageForm.addEventListener('submit', handleFormSubmit)
}

function handleFormSubmit(e) {
  e.preventDefault()
  const msg = newMessageInput.value
  if (!!msg) {
    nsSocket.emit('newMessageToServer', { text: msg })
    newMessageInput.value = ''
  }
}

function handleSearchBoxInputEvt(e) {
  console.log(e.target.value)
  const messages = Array.from(document.getElementsByClassName('message-text'))
  messages.forEach(msg => {
    if (msg.innerText.toLowerCase().indexOf(e.target.value.toLowerCase()) === -1) 
      msg.style.display = 'none'
    else
      msg.style.display = 'block'
  })

}

socket.on('nsList', nsList => {
  namespacesDiv.innerHTML = ''
  nsList.forEach(ns => namespacesDiv.innerHTML += `
    <div class="namespace" data-ns="${ns.endpoint}">
      <img src="${ns.img}" alt="${ns.endpoint}">
    </div>
  `)
  joinNS(nsList[0].endpoint)
})

roomList.addEventListener('click', ({ target }) => {
  if (target.tagName !== 'UL') {
    const roomtitle = target.dataset.roomtitle
    joinRoom(roomtitle)
  }
})

namespacesDiv.addEventListener('click', ({ target }) => {
  if (target.tagName === 'IMG') {
    joinNS(target.parentElement.dataset.ns)
  }
})