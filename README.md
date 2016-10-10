# Orka-Server
<hr>
Raspberry Pi Monitor and Controller 
[Official Page](https://haikarthikssk.github.io/Orka-Server/)

### To Run :
1. git clone https://github.com/haikarthikssk/Orka-Server.git
2. cd Orka-Server
3. npm install & npm start

## Features
* Control and Monitor hundreds of clients using single tool.
* Real-time Statistics and Threshold Monitoring
* File Manager
* Shell Access
* Create List to group clients
* Broadcast or Multicast commands to connected clients.
* Schedule Task to execute commands at regular Interval
* Get Notified via system notifications and via [Flock](https://www.flock.co/)

## Instructions

#### Client Configuration
1. Clone Orka Client into Raspberry Pi . Works on Linux and Windows too.
 * `git clone https://github.com/haikarthikssk/Orka-Client.git`
2. Install the Dependencies and Start the client
 * `cd Orka-Client`
 * `npm install & npm start`
3. Now Orka client will start listening at default port 1993. Custom port can be also passed a parameter.
 * `node client.js <port number>`
 
##### Client can be downloaded from the below link
[Orka Client](https://github.com/haikarthikssk/Orka-Client)
<hr>
#### Server Configuration
1. Launch Orka-Server. Choose Add Pi From Home Menu.
2. Fill the details in the modal window such as name, IP Address, and PI.
3. Click Add. That's it.
4. Now your pi will be connected to the Orka-Server and starts polling statistics in 5(default) seconds.

##### Creating Lists
<p>Lists are useful when you want to control a particular group of Pi. You can send commands, run tasks for the particular lists.</p>
1. Choose Manage Lists from the Home Menu.
2. Give the name for the list and choose the Pi which has to added to the list in the Modal window.
3. click add to create the List

##### Batch Execute Command
1. Choose Batch Execute Command from the Home Menu.
2. Choose either you want to broadcast the command to all the connected Pi or to particular client or lists.
3. Type the command you want to execute in the command window.
4. Start. The commands will be send to the clients and the command output is stored at the notification panel.

##### Tasks
<p> Tasks are very much useful when you want to run command at particular interval. It can be either a single-shot or repeatative.</p>
1. Choose Manage Tasks from the Home Menu.
2. Give a name and interval for the task.
3. Choose the type either Timeout(single-shot) or Interval (repeatative)
4. Choose the clients. The clients can be either a single client or a group of clients(lists)
5. Specify the command to execute 
6. Click Create Task.
<p> The task will not be started unless until it is started from the Task Panel.</p>

## Why Orka ?
  I am aware that there are lot of tools available to control multiple clients. Most of them are command line tools. I wanted to create a one click access Gui tool to control Multiple clients. And that's why Orka was born. Peace!....

### Caution!
Orka is in Aplha Stage. Many features(like authentication) are yet to be merged. Kindly avoid using it in production environment.
