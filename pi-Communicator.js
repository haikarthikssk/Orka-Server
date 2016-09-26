/************************************************************************************************
 *  pi-Communicator.js
 *  maps socket id to client names
 *  Singleton class
 ***********************************************************************************************/
'use strict'

let PiHTTPHelper = (function () {
  const request = require('request')
  let instance = null

  // inner class
  function initialize () {
    var socketIdMap = {}  // Map to hold socket id and names

    /**
     * connects to remote pi and passes the (reverse) connection information as post data
     * @param  {string} ip   ip to connect
     * @param  {number} port port
     * @param  {object} data information about the server to conenct back and monitoring settings
     * @return {none}     none
     */
    function connectToPi (ip, port, data) {
      request.post({
        url: `http://${ip}:${port}/connect`,
        method: 'POST',
        json: true,
        body: data
      }, function (err) {
        console.warn(err)
      })
    }

    /**
     * converts socket id into name
     * @param  {string} id [socket id]
     * @return {string} name   [name associated with the socket id]
     */
    function getNameFromSocketId (id) {
      for (var socket in socketIdMap) {
        if (socketIdMap[socket] === id) {
          return socket
        }
      }
      return null
    }

    /**
     * converts name into socket id
     * @param  {string} name [name of client]
     * @return {string} socket_id   [socket id associated with the name]
     */
    function getSocketIdFromName (name) {
      if (isAvailable(name)) {
        return socketIdMap[name]
      }
      else {
        return null
      }
    }

    function addSocket (name, id) {
      socketIdMap[name] = id
    }

    function removeSocket (id) {
      delete socketIdMap[getNameFromSocketId(id)]
    }

    function isAvailable (name) {
      return socketIdMap[name] ? true : false
    }

    function getAllSocketsName () {
      return Object.keys(socketIdMap)
    }

    return {
      connectToPi,

      getNameFromSocketId,
      getSocketIdFromName,

      addSocket,
      removeSocket,

      isAvailable,
      getAllSocketsName
    }
  }

  // return Singleton object
  return {
    getInstance: function () {
      if (instance == null) {
        instance = initialize()
      }
      return instance
    }
  }

})();

module.exports = PiHTTPHelper.getInstance();
