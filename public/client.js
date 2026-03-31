const socket = io();
const remoteVideo = document.getElementById('remoteVideo');

// 1. Configure WebRTC with Google's public STUN servers for NAT Traversal
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

let peerConnection;

// 2. Listen for signaling messages from the Android Host
socket.on('message', async (message) => {
    if (!peerConnection) createPeerConnection();

    try {
        if (message.offer) {
            console.log("Received Offer from Android Host");
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('message', { answer: peerConnection.localDescription });
        } 
        else if (message.iceCandidate) {
            console.log("Received ICE Candidate from Android Host");
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
        }
    } catch (e) {
        console.error("WebRTC Error:", e);
    }
});

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Send our ICE candidates to the Android Host
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('message', { iceCandidate: event.candidate });
        }
    };

    // When the Android Host's mixed audio/video stream arrives, play it in the <video> tag
    peerConnection.ontrack = (event) => {
        console.log("Stream received from Android Host!");
        if (remoteVideo.srcObject !== event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
        }
    };
}