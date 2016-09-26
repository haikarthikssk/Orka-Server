
/************************************************************************************************
* IPCbridge - Communication bridge between main and render process (i.e Orka UI and Orka server)
* events in this file must be in sync with the server.js events
*  Singleton class
************************************************************************************************/
;(function () {
  'use strict'
  const {ipcRenderer} = require('electron')

  const orka = angular.module('orka')

  orka.service('IPCbridge', function (orkaNotifier) {
    let _subscribers = []

    /**
     * [subscribeForEvents subscribe for incoming events from Orka Server]
     * @param  {object} subscriber [object should inherit 'updateStats', 'setConnectionStatus' and 'updateSystemInfo']
     */
    this.subscribeForEvents = (subscriber) => {
      if (!subscriber.hasOwnProperty('updateStats') || !subscriber.hasOwnProperty('setConnectionStatus') || !subscriber.hasOwnProperty('updateSystemInfo')) {
        throw new Error(`Property doesn't inherit valid methods`)
      }
      _subscribers.push(subscriber)
    }

    this.executeCommand = function (name, command) {
      ipcRenderer.send('Command', name, command)
    }

    this.sendPiRemoved = function (item) {
      ipcRenderer.send('piRemoved', item)
    }

    this.sendPiAdded = function (args) {
      ipcRenderer.send('piAdded', args)
    }

    this.sendConnectPi = function (args) {
      ipcRenderer.send('connect', args)
    }

    this.sendListCreated = function (name, args) {
      ipcRenderer.send('listCreated', name, args)
    }

    this.sendListRemoved = function (name) {
      ipcRenderer.send('listRemoved', name)
    }

    this.sendClientsAddedToList = function (listName, clients) {
      ipcRenderer.send('clientAddedToList', listName, clients)
    }

    this.sendClientsRemovedFromList = function (listName, client) {
      ipcRenderer.send('clientRemovedFromList', listName, client)
    }

    this.sendClientRemovedFromList = function (listName, client) {
      ipcRenderer.send('clientRemovedFromList', listName, client)
    }

    this.sendTaskCreated = function (taskname, args) {
      ipcRenderer.send('taskCreated', taskname, args)
    }
    this.sendTaskDeleted = function (taskname) {
      ipcRenderer.send('taskDeleted', taskname)
    }
    this.sendDisconnectPi = function (name) {
      ipcRenderer.send('disconnect', name)
    }

    this.sendShutdownSignal = function (event) {
      ipcRenderer.send('quit', event)
    }

    this.sendMinimizeSignal = function () {
      ipcRenderer.send('minimize')
    }

    this.sendOpenExternalURL = (name, hostname) => {
      ipcRenderer.send('open-url', name, hostname)
    }

    this.getClientInfoFromSettings = function () {
      return ipcRenderer.sendSync('client-info-settings')
    }

    this.sendSaveClientConnectionSettings = function (settings) {
      ipcRenderer.send('set-client-connection-settings', settings)
    }

    this.getServerPort = function () {
      return ipcRenderer.sendSync('get-server-options')
    }

    this.getListsInfoFromSettings = function () {
      return ipcRenderer.sendSync('lists-info-settings')
    }

    this.getTasksInfoFromSettings = function () {
      return ipcRenderer.sendSync('tasks-info-settings')
    }

    this.getClientConnectionInfoFromSettings = function () {
      return ipcRenderer.sendSync('client-connection-settings')
    }

    this.getNotificationStatus = function () {
      return ipcRenderer.sendSync('notification-settings')
    }

    this.sendSetNotificationStatus = function (type, state) {
      ipcRenderer.send('toggle-notification-status', type, state)
    }

    this.sendSaveFlockWebHook = function (webhook) {
      ipcRenderer.send('set-flock-webhook', webhook)
    }
    this.sendSetServerPort = function (port) {
      ipcRenderer.send('set-server-options', port)
    }

    this.sendResetDefaultSettings = function () {
      ipcRenderer.send('reset-default-settings')
    }

    let updateStats = function (event, args) {
      _subscribers.forEach((subscriber) => {  // send stats to all subscribers
        subscriber.updateStats(args.name, args.data)
      })
    }
    ipcRenderer.on('stats', updateStats)

    ipcRenderer.on('settings-restored-to-default', function (event, args) {
      orkaNotifier.notify('orkaEvents', {
        status: 'success',
        name: 'orka',
        message: 'Settings restored to default'
      })
    })

    ipcRenderer.on('setPiConnectionStatus', function (event, args) {
      _subscribers.forEach((subscriber) => {
        subscriber.setConnectionStatus(args)
      })
    })

    ipcRenderer.on('output', function (event, data) {
      orkaNotifier.notify('commandOutput', data)
    })

    ipcRenderer.on('alert', function (event, data) {
      orkaNotifier.notify('alerts', data)
    })

    ipcRenderer.on('systemInfo', function (event, args) {
      _subscribers.forEach((subscriber) => {
        subscriber.updateSystemInfo(args.name, args.data)
      })
    })
  })
})()
