/************************************************************************************************
 *  orka-ui-notifier.js - notifies the events in UI via toast or by system notifications
 ***********************************************************************************************/
;(function () {
  'use strict'
  const orka = angular.module('orka')

  orka.controller('orkaUiNotification', function ($scope, orkaNotifier, generatorService, orkaSettingsService, orkaFlockNotifier) {
    let unreadCount = 0
    // initialize the messenger
    ;(function setup () {
      Messenger.options = {
        extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
        theme: 'air'
      }
    })()

    // called when new notification arrives
    this.getNotified = (event, data) => {
      if (event === 'commandOutput') {
        updateNotificationTable(data)
      } else if (event === 'orkaEvents') {
        showNotificationDialog(data)
      } else if (event === 'alerts') {
        processAlertNotifications(data)
      }
    }

    let updateNotificationTable = (data) => {
      const table = $('#notificationTable')
      let name = $(document.createElement('td')).text(data.name)
      let status = $(document.createElement('td')).text(data.output.status === 'stdout' ? 'success' : 'error')
      let date = $(document.createElement('td')).text(data.output.time)
      let command = $(document.createElement('td')).text(data.output.command)
      let output = $(document.createElement('td')).text(data.output.message)
      let tr = $(document.createElement('tr'))
        .addClass(data.output.status === 'stdout' ? 'positive' : 'negative')
        .append(name)
        .append(status)
        .append(date)
        .append(command)
        .append(output)
      table.append(tr)

      if ($('#notificationDisplay').css('display') === 'none') {
        unreadCount++
        $('#notificationHeaderLabel').text($scope.getUnreadCount()).show()
      }
    }
    $scope.resetUnreadCount = () => {
      unreadCount = 0
    }
    $scope.getUnreadCount = () => {
      return unreadCount
    }

    let showNotificationDialog = (data) => {
      if (data.status === 'critical' || data.status === 'alert') {
        if (!orkaSettingsService.systemNotificationEnabled) {
          return
        }
        new Notification (data.name || '', {
          body: data.message || ''
        })
      } else {
        if (!orkaSettingsService.uiNotificationEnabled) {
          return
        }
        Messenger().post({
          message: data.message || '',
          type: data.status || 'info',
          hideAfter: 4,
          showCloseButton: true
        })
      }
    }
    let processAlertNotifications = (data) => {
      if (orkaSettingsService.uiNotificationEnabled) {
        Messenger().post({
          message: `${data.name} ${data.message}` || '',
          type: data.status || 'info',
          hideAfter: 4,
          showCloseButton: true
        })
      }

      if (orkaSettingsService.systemNotificationEnabled) {
        if (data.message !== '') {
          new Notification (data.name || '', {
            body: data.message || ''
          })
        }
      }
    }

    // subscribe to the events
    orkaNotifier.subscribe('commandOutput', this)
    orkaNotifier.subscribe('orkaEvents', this)
    orkaNotifier.subscribe('alerts', this)

    $('#notificationHeaderItem').on('click', () => {
      $scope.resetUnreadCount()
      $('#notificationHeaderLabel').hide()
    })
  })
})()
