import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { UserManager } from './managers/UserManger';

// Extend WebSocket to include id property
declare module 'ws' {
  interface WebSocket {
    id: string;
  }
}

const wss = new WebSocketServer({ port: 8080 });
const userManager = new UserManager();

wss.on('connection', (ws: WebSocket) => {
  ws.id = uuidv4();
  console.log(`New connection: ${ws.id}`);

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${ws.id}:`, error);
  });

  ws.on('close', () => {
    console.log(`Connection closed: ${ws.id}`);
    userManager.removeUser(ws.id);
  });

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      console.error(`Invalid message from ${ws.id}:`, error);
      return;
    }

    console.log(`Received message from ${ws.id}:`, message.type);

    // Handle different message types
    if (message.type === 'sender') {
      // Add user when they identify as sender
      userManager.addUser('randomName', ws);
    } else if (message.type === 'offer') {
      userManager.handleOffer(ws.id, message.sdp, message.roomId);
    } else if (message.type === 'answer') {
      userManager.handleAnswer(ws.id, message.sdp, message.roomId);
    } else if (message.type === 'add-ice-candidate') {
      userManager.handleIceCandidate(ws.id, message.candidate, message.roomId, message.candidateType);
    }
  });
});