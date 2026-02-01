# 🎥 Video Call Application

A real-time peer-to-peer video calling application built with WebRTC, WebSockets, React, and TypeScript. This project enables seamless video communication between users through a modern web interface.

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## ✨ Features

- 🎬 **Real-time Video Calling** - Peer-to-peer video communication using WebRTC
- 🔄 **WebSocket Signaling** - Efficient real-time messaging for connection negotiation
- 🎨 **Modern UI** - Built with React 19 and styled with Tailwind CSS
- 🔒 **Type-Safe** - Full TypeScript implementation on both frontend and backend
- 🐳 **Docker Ready** - Containerized application for easy deployment
- 🚀 **Production Optimized** - Built with Vite for optimal performance
- 📱 **Responsive Design** - Works seamlessly across different screen sizes

---

## 🏗️ Architecture

The application consists of three main components:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│   Frontend      │◄───────►│   WebSocket      │◄───────►│   Frontend      │
│   (React)       │         │   Signaling      │         │   (React)       │
│                 │         │   Server         │         │                 │
└────────┬────────┘         └──────────────────┘         └────────┬────────┘
         │                                                          │
         │                    WebRTC P2P Connection                 │
         └──────────────────────────────────────────────────────────┘
```

### Backend
- **WebSocket Server** - Handles signaling for WebRTC connections
- **User Manager** - Manages active connections and rooms
- **Message Router** - Routes offers, answers, and ICE candidates

### Frontend
- **React Components** - Modern component-based architecture
- **WebRTC API** - Direct peer-to-peer media streaming
- **Socket.io Client** - Real-time communication with signaling server
- **React Router** - Client-side routing

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Docker** (optional, for containerized deployment)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd video-call
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend1
   npm install
   ```

### Development

#### Running Backend
```bash
cd backend
npm run dev
```
The WebSocket server will start on `http://localhost:3000`

#### Running Frontend
```bash
cd frontend1
npm run dev
```
The frontend will start on `http://localhost:5173`

---

## 🐳 Docker Deployment

### Using Docker Compose

The easiest way to run the entire application:

```bash
docker-compose up --build
```

This will start:
- Backend service on port `3000`
- Frontend service on port `5173`

### Individual Container Builds

**Build Backend:**
```bash
cd backend
docker build -t video-call-backend .
docker run -p 3000:3000 video-call-backend
```

**Build Frontend:**
```bash
cd frontend1
docker build -t video-call-frontend .
docker run -p 5173:5173 video-call-frontend
```

### Nginx Deployment

For production deployment with Nginx:

```bash
chmod +x deploy-nginx.sh
./deploy-nginx.sh
```

---

## 📁 Project Structure

```
video-call/
├── backend/
│   ├── src/
│   │   ├── index.ts              # WebSocket server entry point
│   │   └── managers/             # User and room management
│   ├── Dockerfile                # Backend container config
│   ├── package.json              # Backend dependencies
│   └── tsconfig.json             # TypeScript config
├── frontend1/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   ├── Dockerfile                # Frontend container config
│   ├── package.json              # Frontend dependencies
│   └── vite.config.ts            # Vite configuration
├── docker-compose.yml            # Docker orchestration
├── nginx.conf                    # Nginx configuration
├── deploy-nginx.sh               # Nginx deployment script
└── README.md                     # This file
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Styling |
| **React Router** | Client-side routing |
| **Socket.io Client** | WebSocket communication |
| **WebRTC API** | Peer-to-peer video streaming |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime environment |
| **TypeScript** | Type safety |
| **ws** | WebSocket library |
| **uuid** | Unique ID generation |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy & load balancing |

---

## 🔧 Configuration

### Environment Variables

#### Backend
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
```

#### Frontend
```env
NODE_ENV=production
VITE_WS_URL=ws://localhost:3000
```

### WebSocket Messages

The application uses the following WebSocket message types:

| Type | Direction | Purpose |
|------|-----------|---------|
| `sender` | Client → Server | Identify user |
| `offer` | Client → Server | Send WebRTC offer |
| `answer` | Client → Server | Send WebRTC answer |
| `add-ice-candidate` | Client → Server | Send ICE candidate |

---

## 📝 Scripts

### Backend Scripts
```bash
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript to JavaScript
npm test           # Run tests (not yet implemented)
```

### Frontend Scripts
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🔒 Security Considerations

- 🔐 **HTTPS/WSS** - Use secure protocols in production
- 🛡️ **CORS** - Configure appropriate CORS policies
- 🔑 **Authentication** - Implement user authentication (recommended)
- 🌐 **STUN/TURN** - Configure STUN/TURN servers for NAT traversal
- 📜 **SSL Certificates** - Use valid SSL certificates (cert.pem & key.pem included) (for local dev)

---



## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- WebRTC API documentation
- React community
- Socket.io team
- All contributors and supporters

---

## 📞 Support

If you encounter any issues or have questions:

- 🐛 [Report a Bug](../../issues)
- 💡 [Request a Feature](../../issues)
- 📧 Contact the maintainer

---

<div align="center">

**Made with ❤️ using React and WebRTC**

⭐ Star this repository if you find it helpful!

</div>
