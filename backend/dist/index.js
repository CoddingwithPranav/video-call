"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const uuid_1 = require("uuid");
const UserManger_1 = require("./managers/UserManger");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const userManager = new UserManger_1.UserManager();
wss.on('connection', (ws) => {
    ws.id = (0, uuid_1.v4)();
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
        }
        catch (error) {
            console.error(`Invalid message from ${ws.id}:`, error);
            return;
        }
        console.log(`Received message from ${ws.id}:`, message.type);
        // Handle different message types
        if (message.type === 'sender') {
            // Add user when they identify as sender
            userManager.addUser('randomName', ws);
        }
        else if (message.type === 'offer') {
            userManager.handleOffer(ws.id, message.sdp, message.roomId);
        }
        else if (message.type === 'answer') {
            userManager.handleAnswer(ws.id, message.sdp, message.roomId);
        }
        else if (message.type === 'add-ice-candidate') {
            userManager.handleIceCandidate(ws.id, message.candidate, message.roomId, message.candidateType);
        }
    });
});
