import { useEffect, useRef, useState } from "react"
import { RealRoom } from "./RealRoom";

export const Landing = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        try {
            const stream = await window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            const audioTrack = stream.getAudioTracks()[0]
            const videoTrack = stream.getVideoTracks()[0]
            setLocalAudioTrack(audioTrack);
            setlocalVideoTrack(videoTrack);
            if (!videoRef.current) {
                return;
            }
            videoRef.current.srcObject = new MediaStream([videoTrack])
            videoRef.current.play();
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Please allow camera and microphone access to continue");
        }
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef]);

    const handleLeave = () => {
        setJoined(false);
        // Re-initialize camera when returning to landing
        setTimeout(() => {
            getCam();
        }, 100);
    };

    if (!joined) {
            
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex p-10 md:p-0 md:items-center md:justify-center">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-xl">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Video Call</h1>
                    <p className="text-gray-600 text-sm sm:text-base">Connect with anyone, anywhere</p>
                </div>

                {/* Video Preview Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
                    <div className="relative bg-gray-900 aspect-video">
                        <video 
                            autoPlay 
                            muted 
                            playsInline
                            ref={videoRef}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-5 py-1.5 rounded-full">
                            <p className="text-white text-xs sm:text-sm font-medium">Preview</p>
                        </div>
                    </div>
                </div>
                <div className="my-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800 placeholder-gray-400"
                    />
                </div>
                <button
                    onClick={() => {
                        if (name.trim()) {
                            setJoined(true);
                        } else {
                            alert("Please enter your name");
                        }
                    }}
                    disabled={!name.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Start Video Call
                </button>

                {/* Info Text */}
                <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 px-4">
                    By joining, you'll be connected with a random person for a video call
                </p>
            </div>
        </div>
    )
    }

    return <RealRoom name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} onLeave={handleLeave} />
}
