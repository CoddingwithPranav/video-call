"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    addUser(name, socket) {
        this.users.push({ name, socket });
        this.queue.push(socket.id);
        console.log(`User added: ${name} (${socket.id})`);
        socket.send(JSON.stringify({ type: 'lobby' }));
        this.clearQueue();
    }
    removeUser(socketId) {
        const user = this.users.find((x) => x.socket.id === socketId);
        this.users = this.users.filter((x) => x.socket.id !== socketId);
        this.queue = this.queue.filter((x) => x !== socketId); // Fixed: was checking x === socketId
        console.log(`Removed user: ${socketId}`);
    }
    clearQueue() {
        console.log(`Queue length: ${this.queue.length}`);
        if (this.queue.length < 2) {
            return;
        }
        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        console.log(`Pairing users: ${id1} and ${id2}`);
        const user1 = this.users.find((x) => x.socket.id === id1);
        const user2 = this.users.find((x) => x.socket.id === id2);
        if (!user1 || !user2) {
            console.log('One or both users not found');
            return;
        }
        console.log('Creating room');
        this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }
    handleOffer(senderId, sdp, roomId) {
        this.roomManager.onOffer(roomId, sdp, senderId);
    }
    handleAnswer(senderId, sdp, roomId) {
        this.roomManager.onAnswer(roomId, sdp, senderId);
    }
    handleIceCandidate(senderId, candidate, roomId, type) {
        this.roomManager.onIceCandidates(roomId, senderId, candidate, type);
    }
}
exports.UserManager = UserManager;
