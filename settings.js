/************************************************************************************************
 *  Settings.js
 *  manages reading and writing settings from disk
 *  Singleton class
 ***********************************************************************************************/

'use strict'

;(function () {
  let piSettings = (function () {
    const settings = require('electron-settings')
    let instance = null

    function initialize () {
      // default settings of orka. loaded at first startup and after settings restored to default
      let defaultSettings = {
        server: {
          port: 8000
        },
        clients: {

        },
        lists: {

        },
        tasks: {

        },
        notification: {
          'systemNotification': true,
          'uiNotification': true,
          'flockNotification': true,
          'flockWebHook': undefined
        },
        logs: {
          'logging': true
        },
        clientConnectionSettings: {
          ip: '127.0.0.1',
          port: 8000,
          interval: 5000,
          threshold: {
            temperature: {
              value: 50,
              command: '',
              notify: true
            },
            ram: {
              value: 90,
              command: '',
              notify: true
            },
            disk: {
              value: 99,
              command: '',
              notify: false
            },
            io: {
              value: 0,
              command: '',
              notify: true
            }
          }
        }
      }

      let resetSettings = () => {
        settings.resetToDefaults()
      }

      let getServerOptions = () => {
        return settings.getSync('server')
      }

      let setServerOptions = (port) => {
        if (port % 1 === 0) {
          settings.setSync('server.port', port)
          settings.setSync(`clientConnectionSettings.port`, port)
        }
      }

      let getClientConnectionSettings = () => {
        return settings.getSync('clientConnectionSettings')
      }
      let setClientConnectionSettings = (options) => {
        settings.setSync(`clientConnectionSettings`, JSON.parse(options))
      }

      let getClients = () => {
        return settings.getSync('clients')
      }

      let addClient = (name, param) => {
        if (!isAvailable(`clients.${name}`)) {
          settings.setSync(`clients.${name}`, param)
        }
        else {
          console.log(name + ' already present in settings')
        }
      }

      let removeClient = (name) => {
        if (isAvailable(`clients.${name}`)) {
          settings.deleteSync(`clients.${name}`)
        }
        else {
          console.log(`${name} not present in settings`)
        }
      }

      let getAllLists = () => {
        if (isAvailable('lists')) {
          return settings.getSync('lists')
        }
        else {
          return {}
        }
      }

      let getList = (list) => {
        if (isAvailable(`lists.${list}`)) {
          return settings.getSync(`lists.${list}`)
        }
      }

      let addList = (list, args) => {
        if (!isListAvailable(list)) {
          settings.setSync(`lists.${list}`, args)
        }
        else {
          console.log(`${list} already available`)
        }
      }

      let removeList = (list) => {
        if (isListAvailable(list)) {
          settings.deleteSync(`lists.${list}`)
        }
        else {
          console.log(`${list} not available`);
        }
      }

      let addClientsToList = (list, clients) => {
        if (isListAvailable(list)) {
          settings.setSync(`lists.${list}`, getList(list).concat([...clients]))
        }
      }

      // TO-DO Implement this
      let removeClientFromList = (list, client) => {
        if (isListAvailable(list)) {
          settings.setSync(`lists.${list}`, getList(list).filter(item => item !== client))
        }
        else {
          console.log(`${list} not available`)
        }
      }

      let addTask = (taskname, taskOptions) => {
        if (!isTaskAvailable(taskname)) {
          settings.setSync(`tasks.${taskname}`, taskOptions)
        }
      }

      let removeTask = (taskname) => {
        if (isTaskAvailable(taskname)) {
          settings.deleteSync(`tasks.${taskname}`)
        }
      }

      let getAllTasks = () => {
        if (isAvailable('tasks')) {
          return settings.getSync('tasks')
        }
      }

      let getTask = (taskname) => {
        if (isTaskAvailable(taskname)) {
          return settings.getSync(`tasks.${taskname}`)
        }
      }

      let isTaskAvailable = (taskname) => {
        return isAvailable(`tasks.${taskname}`)
      }

      let isAvailable = (setting) => {
        return settings.hasSync(setting)
      }

      let isListAvailable = (list) => {
        return settings.hasSync(`lists.${list}`)
      }

      let getNotificationStatus = () => {
        let status = settings.getSync(`notification`)
        status['logs'] = settings.getSync('logs')
        return status
      }

      let toggleNotificationStatus = (type, state) => {
        let updatePath = type === 'logging' ? 'logs' : 'notification'
        updatePath += `.${type}`
        console.log(updatePath)
        settings.setSync(updatePath, state)
      }

      let setFlockWebHook = (webhook) => {
        settings.setSync(`notification.flockWebHook`, webhook)
      }

      settings.defaults(defaultSettings)

      settings.configure({
        pretiffy: true
      })
        /* Sanity Check.. If settings file is corrupted or it is not present, then create a new one */
      if (getServerOptions() === undefined ||
        getServerOptions().port === {} ||
        getServerOptions().port === undefined) { /* we need atleast  port number to run */
        resetSettings()
      }
      return {
        resetSettings,

        getServerOptions,
        setServerOptions,

        getClientConnectionSettings,
        setClientConnectionSettings,

        getClients,
        addClient,
        removeClient,

        getList,
        getAllLists,
        addList,
        removeList,
        addClientsToList,
        removeClientFromList,

        addTask,
        removeTask,
        getTask,
        getAllTasks,

        toggleNotificationStatus,
        getNotificationStatus,

        setFlockWebHook
      }
    }

    return {
      getInstance: function () {
        if (instance == null) {
          instance = initialize()
        }
        return instance
      }
    }
  })()
  module.exports = piSettings.getInstance()
})()
