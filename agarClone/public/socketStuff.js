const socket = io.connect('http://localhost:8080')

function init() {
  draw()
  socket.emit('init', { playerName: player.name })
}

socket.on('initReturn', data => {
  orbs = data.orbs
  // start ticking
  setInterval(() => {
    socket.emit('tick', { 
      xVector: player.xVector, 
      yVector: player.yVector, 
    })
  })
})

socket.on('tock', data => {
  players = data.players
})

socket.on('orbSwitch', data => {
  orbs.splice(data.orbIndex, 1, data.newOrb)
})

socket.on('tickTock', data => {
  player.locX = data.playerX
  player.locY = data.playerY
})

socket.on('updateLeaderBoard', data => {
  leaderBoard.innerHTML = ''
  data.forEach(player => leaderBoard.innerHTML += `
    <li class="leaderboard-player">${player.name} - ${player.score}<li>
  `)
})

socket.on('playerDeath', data => {
  console.log(`Got killed: ${data.died.name}`);
  console.log(`The killer: ${data.killedBy.name}`);
  document.querySelector('#game-message').innerHTML = `${data.died.name} absorbed by ${data.killedBy.name}`
  $("#game-message").css({
      "background-color": "#00e6e6",
      "opacity": 1
  });
  $("#game-message").show();
  $("#game-message").fadeOut(5000);
})