"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
class RoomManager {
    constructor() {
        this.globalRoomId = 1;
        this.rooms = new Map();
    }
    createRoom(user1, user2) {
        const roomId = this.generate().toString();
        this.rooms.set(roomId, { user1, user2 });
        console.log(`Room created: ${roomId}`);
        user1.socket.send(JSON.stringify({ type: 'send-offer', roomId }));
        user2.socket.send(JSON.stringify({ type: 'send-offer', roomId }));
    }
    onOffer(roomId, sdp, senderSocketId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`Room ${roomId} not found`);
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.send(JSON.stringify({ type: 'offer', sdp, roomId }));
    }
    onAnswer(roomId, sdp, senderSocketId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`Room ${roomId} not found`);
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        receivingUser.socket.send(JSON.stringify({ type: 'answer', sdp, roomId }));
    }
    onIceCandidates(roomId, senderSocketId, candidate, type) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`Room ${roomId} not found`);
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        // Include the candidateType and roomId in the message
        receivingUser.socket.send(JSON.stringify({
            type: 'add-ice-candidate',
            candidate,
            candidateType: type,
            roomId
        }));
    }
    generate() {
        return this.globalRoomId++;
    }
}
exports.RoomManager = RoomManager;
