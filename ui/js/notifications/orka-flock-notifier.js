/************************************************************************************************
 *  orka-flock-notifier.js - notifies critical events to flock
 ***********************************************************************************************/
;(function () {
  'use strict'
  const orka = angular.module('orka')

  orka.service('orkaFlockNotifier', function (orkaNotifier, orkaSettingsService, $http) {
    // called when new notification arrives
    this.getNotified = (event, data) => {
      if (event === 'alerts') {
        sendAlertNotificationsToFlock(data)
      }
    }
    let sendAlertNotificationsToFlock = (data) => {
      if (!orkaSettingsService.flockNotificationEnabled || orkaSettingsService.flockWebHook === '' || !navigator.onLine) {
        console.log('return');
        return
      }
      else {
        $http.post(orkaSettingsService.flockWebHook, {
          url: orkaSettingsService.flockWebHook,
          text: `${data.name} -> ${data.message}`,
          title: data.name
        }).then(
            (data) => { // success
            },
            (err) => {  // error
            }
        )
      }
    }
    // subscribe to the events
    orkaNotifier.subscribe('alerts', this)
  })
})()
