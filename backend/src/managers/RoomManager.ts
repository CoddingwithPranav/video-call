
import { WebSocket } from 'ws';
import { User } from './UserManger';

declare module 'ws' {
  interface WebSocket {
    id: string;
  }
}

interface Room {
  user1: User;
  user2: User;
}

export class RoomManager {
  private rooms: Map<string, Room>;
  private globalRoomId: number = 1;

  constructor() {
    this.rooms = new Map<string, Room>();
  }

  createRoom(user1: User, user2: User) {
  const roomId = this.generate().toString();
  this.rooms.set(roomId, { user1, user2 });
  console.log(`Room created: ${roomId}`);

  user1.socket.send(JSON.stringify({ type: 'send-offer', roomId }));
  user2.socket.send(JSON.stringify({ type: 'send-offer', roomId }));
}
  onOffer(roomId: string, sdp: RTCSessionDescriptionInit, senderSocketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return;
    }
    const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    receivingUser.socket.send(JSON.stringify({ type: 'offer', sdp, roomId }));
  }

  onAnswer(roomId: string, sdp: RTCSessionDescriptionInit, senderSocketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return;
    }
    const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    receivingUser.socket.send(JSON.stringify({ type: 'answer', sdp, roomId }));
  }

  onIceCandidates(roomId: string, senderSocketId: string, candidate: RTCIceCandidateInit, type: 'sender' | 'receiver') {
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

  private generate() {
    return this.globalRoomId++;
  }
}