const mongoose = require('mongoose');
const WebSocket = require('ws');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });

  // WebSocket server setup
  const wss = new WebSocket.Server({ host: '0.0.0.0', port: 5001 });
  logger.info('WebSocket server is listening on port 5001');

  // Store clients with their associated rasID
  const clients = new Map();

  wss.on('connection', (ws) => {
    logger.info('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        logger.info(`Received message: ${JSON.stringify(parsedMessage)}`);

        if (parsedMessage.rasID) {
          // Store the rasID with the client
          // clients.set(ws, parsedMessage.rasID);
          // logger.info(`Stored rasID ${parsedMessage.rasID} for client`);
          if (!clients.has(ws)) {
            clients.set(ws, parsedMessage.rasID);
            logger.info(`Stored rasID ${parsedMessage.rasID} for client`);
          }
        }

        if (parsedMessage.ID) {
          // check if not have ID before set
          if (!clients.has(ws)) {
            clients.set(ws, parsedMessage.ID);
          }
          // Forward the message to the client with the matching rasID
        }
        // clients.forEach((rasID, client) => {
        //   if (rasID === parsedMessage.ID && client.readyState === WebSocket.OPEN && client !== ws) {
        //     client.send(JSON.stringify(parsedMessage));
        //     logger.info(`Forwarded message to client with rasID ${rasID}`);
        //   }
        // });
        // send for client have same ID == rasID
        clients.forEach((rasID, client) => {
          if (rasID === parsedMessage.ID && client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(JSON.stringify(parsedMessage));
            logger.info(`Forwarded message to client with rasID ${rasID}`);
          }
        });

        clients.forEach((ID, client) => {
          if (ID === parsedMessage.rasID && client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(JSON.stringify(parsedMessage));
            logger.info(`Forwarded message to client with ID ${ID}`);
          }
        });

      } catch (e) {
        logger.error('Failed to parse message', e);
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket connection closed');
      clients.delete(ws);
    });
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
