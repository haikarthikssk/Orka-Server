/************************************************************************************************
 *  orka-angular-controller.js
 *  Orka UI Manager. Controls every aspects of UI
 *
 ***********************************************************************************************/
;(function () {
  'use strict'
  angular.module('orka', ['easypiechart'])

  /**
   * service OrkaPi
   * Handles client addition, deletion etc.
   */
  .service('orkaPi', function (orkaNotifier, IPCbridge, $rootScope) {
    this.removePi = (name) => {
      if (this.selectedPi === this.raspberryPi[name]) {
        delete this.selectedPi
      }

      delete this.raspberryPi[name]

      orkaNotifier.notify('orkaEvents', {
        status: 'success',
        name,
        message: `${name} removed from the list.`
      })
    }

    this.updateStats = (name, data) => {
      if (!this.isAvailable(name)) {
        console.error('un-registered client is sending updates')
        return
      }
      this.raspberryPi[name].updateStats(data)
      $rootScope.$emit('statusUpdated', name)
    }
    this.updateSystemInfo = (name, info) => {
      if (!this.isAvailable(name)) {
        console.error('un-registered client is sending updates')
        return
      }
      this.raspberryPi[name].updateSystemInfo(info)
      $rootScope.$emit('systemInfoUpdated', name)
    }
    this.addPi = (ip, port, name) => {
      if (this.raspberryPi[name] === undefined) {
        this.raspberryPi[name] = new Raspberry(ip, port, name)

        orkaNotifier.notify('orkaEvents', {
          status: 'success',
          name: name,
          message: `${name} added to the Orka.`
        })
        return true
      }
      return false
    }

    // the client which is currently selected by the user(from vertical menu bar).
    this.selectPi = (item) => {
      this.selectedPi = this.raspberryPi[item]
    }

    this.isSelectedPi = (item) => {
      if (this.selectedPi == null) {
        return false
      }
      return this.selectedPi.getName() === item
    }

    this.getPi = (item) => {
      return this.raspberryPi[item]
    }

    this.getAllPi = () => {
      return this.raspberryPi
    }

    this.getAllPiNames = () => {
      return Object.keys(this.raspberryPi)
    }

    this.setConnectionStatus = (args) => {
      if (!this.isAvailable(args.name)) {
        console.error('un-registered client is trying connected')
        return
      }
      this.raspberryPi[args.name].setConnectionStatus(args.connected)

      orkaNotifier.notify('orkaEvents', {
        status: args.connected ? 'info' : 'error',
        name: args.name,
        message: `${args.name} is ` + (args.connected ? 'connected' : 'disconnected')
      })
      $rootScope.$apply()
    }

    this.executeCommand = (name, command) => {
      if (this.isAvailable(name)) {
        IPCbridge.executeCommand(name, command)
        orkaNotifier.notify('logs', {
          status: 'success',
          message: '"' + command + '" command sent to ' + name
        })
      }
    }

    this.isConnected = (name) => {
      return this.raspberryPi[name].isConnected()
    }

    this.isAvailable = (item) => {
      return this.raspberryPi[item] !== undefined
    }

    this.raspberryPi = {}
    this.selectedPi = null
    /* subscribe for events from orka Server */
    IPCbridge.subscribeForEvents(this)
  })

  /**
   * service OrkaPiList
   * Handles List creation, deletion etc.
   */
  .service('orkaPiList', function (orkaPi, IPCbridge, orkaNotifier) {
    this.piList = {}

    this.addList = (listname, clients) => {
      if (this.piList[listname] === undefined) {
        this.piList[listname] = clients
        return true
      }
      return false
    }

/**
 * Add clients to existing list.Inserts the clients that are not already on the list
 * @param {string} listName       [name of list to insert into]
 * @param {array} arrayOfClients [array of clients to add in to list]
 */
    this.addToList = (listName, arrayOfClients) => {
      if ((arrayOfClients.length !== 0) && (this.isAvailable(listName))) {
        let arr = [...new Set(arrayOfClients.filter(item => !this.isClientAvailableInList(listName, item)))]
        if (arr.length !== 0) {
          this.piList[listName].push(...arr)
          return [...arr] // return clients that are added to the list
        }
      }
      return []
    }

    this.removeList = (listname) => {
      if (this.piList[listname] !== undefined) {
        delete this.piList[listname]
        return true
      }
      return false
    }

    this.removeFromList = (listname, client) => {
      let index = this.piList[listname].indexOf(client)
      if (index !== -1) {
        this.piList[listname].splice(index, 1)
        return true
      }
      return false
    }

    this.removeFromAllList = (client) => {
      for (let list in this.piList) {
        this.removeFromList(list, client)
      }
    }

    this.getList = (listname) => {
      return this.piList[listname]
    }

    this.getAllList = () => {
      return Object.keys(this.piList)
    }

    this.isAvailable = (name) => {
      return this.piList[name] !== undefined
    }

    this.isClientAvailableInList = (listName, client) => {
      return this.piList[listName].indexOf(client) !== -1
    }

    // returns unique items from clients and lists
    // set(client,lists) => unique clients
    // To-Do  fix it,when client and List has same name , only client is returned
    this.getUniqueClientsFromLists = (args) => {
      var uniqueList = []
      args.forEach((item) => {
        if (orkaPi.isAvailable(item)) { // if it is a client
          uniqueList.push(item)
        }
        else if (this.isAvailable(item)) {  // if it is a list
          uniqueList = uniqueList.concat(this.getList(item).filter((client) => { return orkaPi.isAvailable(client) }))
        }
        else {
          console.error(`${item} not found in any of list`)
        }
      })
      return [...new Set(uniqueList)]
    }
  })

  /**
   * service orkaSettingsService
   * loads/saves settings from/to orka Server
   */
  .service('orkaSettingsService', function (IPCbridge) {
    this.getServerPort = () => { return IPCbridge.getServerPort()
    console.log(IPCbridge.getServerPort()); }
    this.clients = IPCbridge.getClientInfoFromSettings() || {}
    this.Lists = IPCbridge.getListsInfoFromSettings() || {}
    this.clientConnectionInfo = JSON.stringify(IPCbridge.getClientConnectionInfoFromSettings() || {}, undefined, 4) // pretiffy the JSON

    let notificationStatus = IPCbridge.getNotificationStatus()
    this.uiNotificationEnabled = notificationStatus.uiNotification
    this.systemNotificationEnabled = notificationStatus.systemNotification
    this.loggingEnabled = notificationStatus.logs.logging
    this.flockNotificationEnabled = notificationStatus.flockNotification
    this.flockWebHook = notificationStatus.flockWebHook

    // returns whether the notification is enabled or disabled
    this.getNotificationStatus = (type) => {
      switch (type) {
        case 'uiNotification':
          return this.uiNotificationEnabled
        case 'systemNotification':
          return this.systemNotificationEnabled
        case 'flockNotification':
          return this.flockNotificationEnabled
        case 'logging':
          return this.loggingEnabled
      }
    }

    this.setNotificationStatus = (type, state) => {
      switch (type) {
        case 'uiNotification':
          this.uiNotificationEnabled = state
          break
        case 'systemNotification':
          this.systemNotificationEnabled = state
          break
        case 'flockNotification':
          this.flockNotificationEnabled = state
          break
        case 'logging':
          this.loggingEnabled = state
          break
      }
      IPCbridge.sendSetNotificationStatus(type, state)
    }

    this.sendSaveServerPortSettings = (port) => {
      IPCbridge.sendSetServerPort(port)
    }

    this.saveClientConnectionSettings = (settings) => {
      IPCbridge.sendSaveClientConnectionSettings(settings)
      this.clientConnectionInfo = JSON.stringify(IPCbridge.getClientConnectionInfoFromSettings() || {}, undefined, 4)
    }

    this.saveFlockWebHook = (webhook) => {
      IPCbridge.sendSaveFlockWebHook(webhook)
    }

    this.resetDefaultSettings = () => {
      IPCbridge.sendResetDefaultSettings()
    }
  })

  /**
   * controller orkaCTRL
   * Manages the Home tab.
   */
  .controller('orkaCTRL', function ($scope, $rootScope, orkaPi, orkaPiList, IPCbridge, generatorService, $sce, orkaSchedular) {
    $scope.raspberryPi = orkaPi.raspberryPi
    $scope.selectedPi = orkaPi.selectedPi

    $scope.addPi = () => {  // handled by addPiModal
    }

    $scope.removePi = (item) => {
      if ($scope.selectedPi === orkaPi.getPi(item)) {
        $scope.selectedPi = null
      }

      orkaPi.removePi(item)
      orkaPiList.removeFromAllList(item)
      IPCbridge.sendPiRemoved(item)     // To-Do Move it to Service
    }

    $scope.selectPi = (item) => {
      orkaPi.selectPi(item)
      $scope.selectedPi = orkaPi.getPi(item)
    }

    $scope.getPi = (item) => {
      return orkaPi.getPi(item)
    }

    $scope.isSelectedPi = (item) => {
      return orkaPi.isSelectedPi(item)
    }
    // toggle the connection when the 'connect/disconnect' button is pressed
    $scope.connectOrDisconnect = (item) => {
      if ($scope.getPi(item).isConnected()) {
        IPCbridge.sendDisconnectPi(item)
      } else {
        IPCbridge.sendConnectPi($scope.getPi(item).getConnectionString())
      }
    }

    // opens the shell URL in new electron window
    $scope.openShell = (name) => {
      IPCbridge.sendOpenExternalURL(name, orkaPi.getPi(name).getHostName())
    }
    // opens fileManager in new electron window
    $scope.openFileManagerAsExternal = (name) => {
      IPCbridge.sendOpenExternalURL(name, orkaPi.getPi(name).getFileManagerURL())
    }
    // get the URL parsed by angular
    $scope.getTrustUrl = (url) => {
      return $sce.trustAsResourceUrl(url)
    }
    $rootScope.$on('statusUpdated', (event, name) => {
      // Don't apply unless it is visible to the user.
      if ($scope.isSelectedPi(name) && angular.element('#data-tab-stats').is(':visible')) {
        $scope.$apply()
      }
    })
    $rootScope.$on('systemInfoUpdated', (event, name) => {
      // Don't apply unless it is visible to the user.
      if ($scope.isSelectedPi(name) && angular.element('#data-tab-systemInfo').is(':visible')) {
        $scope.$apply()
      }
    })
    $scope.chartOptions = {
      easing: 'easeOutElastic',
      delay: 3000,
      barColor: generatorService.getNextColor(),  // get random colors
      scaleColor: true,
      lineWidth: 5,
      size: 110,
      lineCap: 'round'
    }
  })
  /**
   * controller orkaSettingsController
   * Manages Settings tab
   */
  .controller('orkaSettingsController', function ($scope, orkaSettingsService) {
    $scope.selectedTabItem = ''
    $scope.serverPort = orkaSettingsService.getServerPort()
    $scope.clientConnectionSettings = orkaSettingsService.clientConnectionInfo

    $scope.getNotificationStatus = (type) => {
      return orkaSettingsService.getNotificationStatus(type)
    }
    $scope.getFlockWebHook = () => {
      return orkaSettingsService.flockWebHook
    }
    $scope.saveServerPort = () => {
      orkaSettingsService.sendSaveServerPortSettings(angular.element('#portNum')[0].value)
    }
    $scope.toggleNotificationStatus = (event, type) => {
      orkaSettingsService.setNotificationStatus(type, event.currentTarget.checked)
    }

    $scope.saveClientConnectionSettings = () => {
      orkaSettingsService.saveClientConnectionSettings(angular.element('#clientConnectionInfo')[0].value)
    }
    $scope.saveFlockWebHook = () => {
      orkaSettingsService.saveFlockWebHook(angular.element('#flockWebHook')[0].value)
    }
    $scope.resetSettings = () => {
      orkaSettingsService.resetDefaultSettings()
    }
    $scope.showResetModal = () => {
      angular.element('#resetConfirmationModal').modal('show')
    }
  })
  /**
   * controller orkaAddModal
   * manages Add modal
   */
  .controller('orkaAddModal', function ($scope, orkaPi, IPCbridge) {
    $scope.ip = ''
    $scope.port = ''
    $scope.name = ''
    $scope.error_msg = ''

    $scope.addPi = () => {
      if ($scope.ip === '' || $scope.port === '' || $scope.name === '') {
        $scope.error_msg = 'Please fill all the fields!..'
        return
      }
      // TO-DO Add IP Address Validation Regex
      else if ($scope.port % 1 !== 0) {
        $scope.error_msg = 'Port must be integer!..'
        return
      }

      if (orkaPi.addPi($scope.ip, $scope.port, $scope.name) !== true) {
        $scope.error_msg = 'Name Already Present!..'
        return
      }

      IPCbridge.sendPiAdded(orkaPi.getPi($scope.name).getConnectionString())
      $scope.error_msg = ''
    }
  })
  /**
   * controller orkaHeaderCTRL
   * controls the minimize, close buttons
   */
  .controller('orkaHeaderCTRL', function ($scope, IPCbridge) {
    $scope.quit = () => {
      IPCbridge.sendShutdownSignal('close-button-pressed')
    }
    $scope.minimize = () => {
      IPCbridge.sendMinimizeSignal()
    }
  })
  /**
   * controller  orkaPiListModal
   * Handles List creation, deletion etc
   */
  .controller('orkaPiListModal', function ($scope, orkaPi, orkaPiList, IPCbridge) {
    $scope.selectedPi = []
    $scope.listName = ''

    $scope.getAvailablePi = () => {
      return orkaPi.getAllPiNames()
    }

    $scope.createList = () => {
      if ($scope.selectedPi.length === 0) {
        return
      }
      if ($scope.listName === '') {
        return
      }
      // item added to existing list
      if (orkaPiList.isAvailable($scope.listName)) {
        let clientAddedIntoArray = orkaPiList.addToList($scope.listName, $scope.selectedPi)
        if (clientAddedIntoArray.length !== 0) {
          IPCbridge.sendClientsAddedToList($scope.listName, clientAddedIntoArray)
        }
        return
      }
      // new list created
      if (orkaPiList.addList($scope.listName, $scope.selectedPi)) {
        IPCbridge.sendListCreated($scope.listName, $scope.selectedPi)
      }
    }

    $scope.removeList = (name) => {
      if (orkaPiList.removeList(name)) {
        IPCbridge.sendListRemoved(name)
      }
    }

    $scope.removeFromList = (listName, name) => {
      if (orkaPiList.removeFromList(listName, name)) {
        IPCbridge.sendClientsRemovedFromList(listName, name)
      }
    }

    $scope.getList = (name) => {
      return orkaPiList.getList(name)
    }

    $scope.getAllList = () => {
      return orkaPiList.getAllList()
    }
  })
  /**
   * controller orkaTaskModal
   * Handles Task creation, deletion etc.
   */
  .controller('orkaTaskModal', function ($scope, orkaPi, orkaPiList, orkaSchedular) {
    $scope.isBroadcast = false
    $scope.taskName = ''
    $scope.interval = ''
    $scope.commandToExecute = ''
    $scope.selectedPi = []
    $scope.repeat = 'interval'

    $scope.getClientsFromLists = (name) => {
      return orkaPiList.getUniqueClientsFromLists(name)
    }

    $scope.getAvailablePiAndLists = () => {
      return orkaPi.getAllPiNames().concat(orkaPiList.getAllList())
    }

    $scope.isPiConnected = (name) => {
      return orkaPi.isConnected(name)
    }

    $scope.createTask = () => {
      if ($scope.taskName === '' || ($scope.interval % 1 !== 0) || $scope.commandToExecute === '') {
        return
      }
      let clients = ''
      if (!$scope.isBroadcast) {
        if ($scope.selectedPi.length === 0) {
          return
        }
        clients = $scope.getClientsFromLists($scope.selectedPi) // get unique clients from both clients and lists
      } else {
        clients = orkaPi.getAllPiNames()
      }
      if (orkaSchedular.isAvailable($scope.taskName)) {
        return
      }
      // serialize function for writing to the disk
      let fn = Function('orkaPi',`return function temp() { clients = ['${[...clients].join('\',\'')}']; for (let client in clients ) { orkaPi.executeCommand(clients[client], '${$scope.commandToExecute}') } }`)
      orkaSchedular.addTask($scope.taskName, fn(orkaPi), $scope.interval * 1000, $scope.repeat === 'interval')
    }
  })
  /**
   * controller orkaBatchModal
   * Controlls command execution
   */
  .controller('orkaBatchModal', function ($scope, orkaPi, orkaPiList, IPCbridge, orkaNotifier) {
    $scope.isBroadcast = false
    $scope.selectedPi = []
    $scope.commandToExecute = ''

    $scope.getAvailablePi = () => {
      return orkaPi.getAllPiNames()
    }

    $scope.getAvailablePiAndLists = () => {
      return orkaPi.getAllPiNames().concat(orkaPiList.getAllList())
    }

    $scope.isPiConnected = (name) => {
      return orkaPi.isConnected(name)
    }

    $scope.startBatchExecution = () => {
      if ($scope.commandToExecute.length === 0) {
        return
      }

      let piToIterate = ''

      if (!$scope.isBroadcast) {
        if ($scope.selectedPi.length === 0) {
          return
        }
        piToIterate = $scope.resolveListToPi($scope.selectedPi)
      } else {
        piToIterate = orkaPi.getAllPiNames()
      }

      for (let iter = 0; iter !== piToIterate.length; iter++) {
        if (orkaPi.isConnected(piToIterate[iter])) {
          orkaPi.executeCommand(piToIterate[iter], $scope.commandToExecute)
        }
        else {
          console.log(`${piToIterate[iter]} is not Connected`)
        }
      }
    }

    $scope.resolveListToPi = (args) => {
      return orkaPiList.getUniqueClientsFromLists(args)
    }
  })
  /**
   * controller orkaClientInitModel
   * load settings on startup
   */
  .controller('orkaClientInitModel', function ($scope, orkaPi, orkaPiList, IPCbridge, orkaSchedular) {
    $scope.headerText = 'Loading!..';
    /* Read client's information from the settings file and load it into Orkaclient */
    (function () {
      angular.element(document).ready(function () {
        let progress = $('.progress')
        setTimeout(function () {
          progress.progress()

          $('#clientInitModal').modal({
            inverted: true
          }).modal('show')

          $scope.headerText = 'reading Settings from file'
          updateProgress(35)
          // Add clients to the UI
          let clientsInfo = IPCbridge.getClientInfoFromSettings() || {}
          $scope.headerText = 'Adding clients...'

          for (let client in clientsInfo) {
            $scope.headerText = `adding ${client}`

            if (!orkaPi.addPi(clientsInfo[client].ip, clientsInfo[client].port, client)) {
              console.error('cannot add $(client) from settings')
            }
          }
          $scope.headerText = 'Finished adding clients...'
          updateProgress(50)
          // Add lists to the UI
          $scope.headerText = 'creating Lists...'
          let listsInfo = IPCbridge.getListsInfoFromSettings() || {}
          for (let list in listsInfo) {
            $scope.headerText = `creating ${list}`
            orkaPiList.addList(list, listsInfo[list])
          }
          $scope.headerText = 'Finished creating lists...'
          updateProgress(75)
          // send connection request to the clients
          $.each(orkaPi.getAllPiNames(), (index, client) => {
            $scope.headerText = 'Connecting ' + client
            IPCbridge.sendConnectPi(orkaPi.getPi(client).getConnectionString())
          })
          // load task into the UI.
          // Caution: don't start automatically
          $scope.headerText = 'creating Tasks...'
          let tasksInfo = IPCbridge.getTasksInfoFromSettings() || {}
          for (let task in tasksInfo) {
            $scope.headerText = `creating ${task}`
            orkaSchedular.addTask(tasksInfo[task].taskname, Function('orkaPi', tasksInfo[task].fn)(orkaPi), tasksInfo[task].time, tasksInfo[task].repeat)
          }

          $scope.headerText = 'Finished Loading Settings!..'

          updateProgress(100)
          $scope.$apply() // call $digest
          setTimeout(function () {
            $('#clientInitModal').modal('hide')
          }, 1000)
        }, 500)

        // update the progress bar
        function updateProgress (val) {
          progress.progress({
            percent: val
          })
        }
      })
    })()
  })
})()

// client Prototype
// (function(){
var Raspberry = function (ip, port, name) {
  this.temperature = 0
  this.cpu = 0
  this.ram = 0
  this.disk = 0
  this.ip = ip
  this.port = port
  this.name = name
  this.connected = false
  this.systemInfo = {}
}
Raspberry.prototype.getConnectionString = function () {
  return {
    ip: this.ip,
    port: this.port,
    name: this.name
  }
}
Raspberry.prototype.getTemperature = function () {
  return this.temperature
}
Raspberry.prototype.getRam = function () {
  return this.ram
}
Raspberry.prototype.getCPU = function () {
  return this.cpu
}
Raspberry.prototype.getDisk = function () {
  return this.disk
}
Raspberry.prototype.getIP = function () {
  return this.ip
}
Raspberry.prototype.getPort = function () {
  return this.port
}
Raspberry.prototype.getHostName = function () {
  return `http://${this.ip}:${this.port}`
}
Raspberry.prototype.getFileManagerURL = function () {
  return `http://${this.ip}:${this.port}/cloud/`
}
Raspberry.prototype.getName = function () {
  return this.name
}
Raspberry.prototype.executeCommand = function (command) {
  // console.log(command)
  // IPCbridge.getInstance().executeCommand(command)
}
Raspberry.prototype.setConnectionStatus = function (status) {
  this.connected = status
}
Raspberry.prototype.isConnected = function () {
  return this.connected
}
Raspberry.prototype.updateStats = function (statsData) {
  if (statsData.ram !== undefined) {
    this.ram = statsData.ram
  }
  if (statsData.ram !== undefined) {
    this.cpu = statsData.cpu
  }
  if (statsData.temperature !== undefined) {
    this.temperature = statsData.temperature
  }
  if (statsData.disk !== undefined) {
    this.disk = statsData.disk
  }
}
Raspberry.prototype.getSystemInfo = function () {
  return this.systemInfo
}
Raspberry.prototype.updateSystemInfo = function (info) {
  this.systemInfo = info
};
// })();

//
// initialize components with Jquery
// CAUTION : angular will not create element unless until it is shown.
//           So, Jquery will not able to find the element for initialization.
//           Due to this , instead of using semantic initialization, custom initializations are used
//           work-around: initialize the element after angular creates the element.

(function () {
  $(document)
  .ready(function () {
    $('.addPiMenuItem').on('click', () => $('#addPiModal').modal({
      inverted: true
    }).modal('show'))

    $('.addPiListMenuItem').on('click', () => $('#addPiListModal').modal({
      inverted: true
    }).modal('show'))

    $('.addTaskListMenuItem').on('click', () => $('#addPiTaskModal').modal({
      inverted: true
    }).modal('show'))

    $('.batchExecuteCommandMenuItem').on('click', () => $('#batchExecuteModal').modal({
      inverted: true
    }).modal('show'))

    $('.ui.dropdown').dropdown()
    $('#homeDisplay').on('click', '#itemInfo .item', (e) => {
      $('#itemInfo .active').removeClass('active')
      $('#itemInfo .segment.active').removeClass('active')
      $(e.target).addClass('active')
      $('#data-tab-' + $(e.target).attr('data-tab')).addClass('active')
    })

    $('.loader').on('click', function () {
      var target = $(this).attr('href')

      if ($(target).css('display') !== 'none') {
        return
      }

      if (target != null && target !== '') {
        $('#displayArea').children().hide().promise().done(function () {
          $(target).show()
        })
      }
    })
  })
})()
