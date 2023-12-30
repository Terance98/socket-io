# Command to get the number of socket connections currently in use

netstat -an | grep ESTABLISHED | wc -l

# Socket connection limit

- one client can have 65535 connections to a given server's port. The tuple (clientIp, client port, serverIp, serverPort) needs to be unique. Here even if the server use the same port, the client can play with its max limit of 65535 ports to open sockets in the server
- Similarly another client could open up another 65535 ports within the server
- So the scale is literally infinite
- The limiting condition is the RAM
- In my rough estimate, a single socket connection takes 100KB of ram. Therefore with 1MB, we can have 10 connections. With 1GB, that is 10000 connections
- So ideally a vertically scaling machine could do the job for the time being
- But eventually the best system would be several 2gb systems handling the socket connections

# Optimizations

- One of the major optimization that can be done is to make websocket server as decoupled and light weight as possible
- Ideally, websocket server gets an event, passes it to the message queue, the other microservices will generate the response and push it back again to the message queue, message queue will push the event to the websocket server which in turn will emit it back to the client
- This will use up only the least amount of memory, hence it can focus just on its primary task which is managing the state of the connections
