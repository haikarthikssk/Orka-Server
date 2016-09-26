/************************************************************************************************
 *  orka-ui-logger.js - logs the events in the event table
 ***********************************************************************************************/
 // TO-DO log the event to file
;(function () {
  const orka = angular.module('orka')

  orka.controller('orkaUiLogger', function ($scope, orkaNotifier, orkaSettingsService) {
    this.getNotified = (event, data) => {
      updateLogsTable(event, data)
    }

    let updateLogsTable = (event, data) => {
      if (!orkaSettingsService.loggingEnabled) {
        return
      }
      let table = $('#logsTable')
      let type = $(document.createElement('td')).text(event === 'alerts' ? 'Alert' : 'System Event')
      let date = $(document.createElement('td')).text(new Date())
      let log = $(document.createElement('td')).text(event === 'alerts' ? data.name + ' -> ' + data.message : data.message)
      let tr = $(document.createElement('tr'))
        .append(type)
        .append(date)
        .append(log)
      table.append(tr)
    }
    // subscribe to events
    orkaNotifier.subscribe('alerts', this)
    orkaNotifier.subscribe('logs', this)
    orkaNotifier.subscribe('orkaEvents', this)
  })
})()
