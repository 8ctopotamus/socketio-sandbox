const os = require('os')
const io = require('socket.io-client')
const socket = io('http://localhost:8181')

socket.on('connect', () => {
  console.log('Socket client connected!')
  const nI = os.networkInterfaces()
  let macA
  for (let key in nI) {
    if (!nI[key][0].internal) {
      macA = Math.floor(Math.random() * 3) + 1 // for testing
      // macA = nI[key][0].mac
      break
    }
  }
  
  socket.emit('clientAuth', 'nodeClient_XXXXXXXXXXXXXXXXXX')

  performanceData().then(allPerformanceData => {
    socket.emit('initPerfData', {
      ...allPerformanceData,
      macA,
    })
  })

  let perfDataInterval = setInterval(() => {
    performanceData().then(allPerformanceData => {
      socket.emit('perfData', {
        ...allPerformanceData,
        macA,
      })
    })
  }, 1000)

  socket.on('disconnect', () => clearInterval(perfDataInterval))
})

function performanceData() {
  return new Promise(async resolve => {
    const osType = os.type() === 'Darwin' ? 'Mac' : os.type()
    const upTime = os.uptime()
    const freeMem = os.freemem()
    const totalMem = os.totalmem()
    const usedMem = totalMem - freeMem
    const memUsage = Math.floor(usedMem / totalMem * 100) / 100
    const cpus = os.cpus()
    const cpuModel = cpus[0].model
    const cpuSpeed = cpus[0].speed
    const numCors = cpus.length
    const cpuLoad = await getCPULoad()
    const isActive = true
    resolve({
      osType,
      upTime,
      freeMem,
      totalMem,
      usedMem,
      memUsage,
      cpuModel,
      cpuSpeed,
      numCors,
      cpuLoad,
      isActive,
    })
  })
}

function cpuAverage() {
  const cpus = os.cpus()
  let idleMs = 0
  let totalMs = 0
  cpus.forEach(core => {
    for (type in core.times) {
      totalMs += core.times[type]
    }
    idleMs += core.times.idle
  })
  return { 
    idle: idleMs / cpus.length,
    total: totalMs / cpus.length,
  }
}

function getCPULoad() {
  const start = cpuAverage()
  return new Promise(resolve => {
    setTimeout(() => {
      const end = cpuAverage()
      const idleDifference = end.idle - start.idle
      const totalDifference = end.total - start.total
      const percentageCpu = 100 - Math.floor(100 * idleDifference / totalDifference)
      resolve(percentageCpu)
    }, 100)
  })
}