import * as mediasoup from 'mediasoup-client';
import { getDisplayMedia, getUserMedia } from '../helper/helper';

export const InitialiseConnection = (meetId: string) => {
    const newSocket =  new WebSocket(`ws://localhost:8000/meet`);
    // const newSocket =  new WebSocket(`https://d27ek27ht07wc6.cloudfront.net/meet`);
    // const newSocket =  new WebSocket("https://7694-14-97-122-202.ngrok-free.app/ws");
    return newSocket;
}

export const sendRequest = (socket: WebSocket, type: string, data?: {}) => {
    if(data)
        socket.send(JSON.stringify({type, data}));
    else
        socket.send(JSON.stringify({type}));
}

export const onProducerTransportCreated = async(params: any, device: mediasoup.types.Device) => {
    let transportData: mediasoup.types.TransportOptions = {
        id: params.id,
        dtlsParameters: params.dtlsParameters,
        iceCandidates: params.iceCandidates,
        iceParameters: params.iceParameters,
        sctpParameters: params.sctpParameters,
        iceServers: [{
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        },
        {
            urls: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        },
        {
            urls: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        },
        {
            urls: 'turn:turn.bistri.com:80',
            credential: 'homeo',
            username: 'homeo'
         },
         {
            urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
        }]
    }

    return device.createSendTransport(transportData);
}

export const InitialiseScreenTransportListener = async(
    screenTransport: mediasoup.types.Transport, 
    socket: WebSocket,
    meetId: string,
    user: {userKey?: string, userName: string, userId: string}
) => {
    screenTransport.on("connect", async({dtlsParameters}, callback, err) => {
        sendRequest(socket, "connectScreenTransport", {dtlsParameters, meetId, userKey: user.userKey});
        socket.addEventListener( "message" , (event: MessageEvent) => {
            let response = JSON.parse(event.data);
            if(response.type == "screenConnected"){
              callback();
            }
        });
    });

    screenTransport.on("produce", async({kind, rtpParameters}, callback, err) => {
        sendRequest(socket, "screenProduce", {transportId: screenTransport.id,  kind, rtpParameters, meetId, user});

        socket.addEventListener("message", (event: MessageEvent) => {
            let data = JSON.parse(event.data);
            if(data.type == "screenVideoProduced"){
                callback(data.response.producerId);
            }
        })
    });

}

export const InitialiseBlankTransportListener = async(
    blankTransport: mediasoup.types.Transport, 
    socket: WebSocket,
    meetId: string,
    user: {userKey?: string, userName: string}
) => {
    blankTransport.on("connect", async({dtlsParameters}, callback, err) => {
        sendRequest(socket, "connectBlankTransport", {dtlsParameters, meetId, userKey: user.userKey});
        socket.addEventListener( "message" , (event: MessageEvent) => {
            let response = JSON.parse(event.data);
            if(response.type == "blankConnected"){
              callback();
            }
        });
    });

    blankTransport.on("produce", async({kind, rtpParameters}, callback, err) => {
        sendRequest(socket, "blankProduce", {transportId: blankTransport.id,  kind, rtpParameters, meetId, user});

        socket.addEventListener("message", (event: MessageEvent) => {
            let data = JSON.parse(event.data);
            if(data.type == "blankVideoProduced"){
                callback(data.response.producerId);
            }
        })
    });

    const blankVideoStream = new MediaStream();
    const canvas = document.createElement('canvas');
    canvas.width = 1024; 
    canvas.height = 720;
    const videoTrack = canvas.captureStream().getVideoTracks()[0];
    console.log("videoTrack: ", videoTrack);

    blankVideoStream.addTrack(videoTrack);
    console.log("blankStream :", blankVideoStream.getVideoTracks())
    await blankTransport.produce({track: blankVideoStream.getVideoTracks()[0], encodings: [{
        scalabilityMode: "L1T3"
    }]});

}

export const InitialiseProducerTransportListener = async(
    producerTransport: mediasoup.types.Transport, 
    socket: WebSocket,
    device: mediasoup.types.Device, 
    meetId: string,
    user: {userKey?: string, userName: string, userId: string, avatarKey: string}) => {
    
    producerTransport.on("connect", async({dtlsParameters}, callback, err) => {
        sendRequest(socket, "connectProducerTransport", {dtlsParameters, meetId, userKey: user.userKey});
        socket.addEventListener( "message" , (event: MessageEvent) => {
            let response = JSON.parse(event.data);
            if(response.type == "producerConnected"){
              callback();
            }
        });
    });

    producerTransport.on("produce", async({kind, rtpParameters}, callback, err) => {
        sendRequest(socket, "produce", {transportId: producerTransport.id,  kind, rtpParameters, meetId, user});

        socket.addEventListener("message", (event: MessageEvent) => {
            let data = JSON.parse(event.data);
            if(data.type == "audioProduced" || data.type == "videoProduced"){
                callback(data.response.producerId);
            }
        })
    });

    if(device.canProduce("video") && device.canProduce("audio")){
        return await getUserMedia({video: true, audio: true}).then( async(stream) => {
            const videotrack = stream.getVideoTracks()[0];
            const audiotrack = stream.getAudioTracks()[0];
            try{
                await producerTransport.produce({track: videotrack, encodings: [{
                    scalabilityMode: "L1T3"
                }]});
                await producerTransport.produce({track: audiotrack});

                return stream;
            }catch(error){
                console.log("Can't Produce : ", error);
            }
        });
    }

}

export const InitialiseProducerTransportListenerJoinSession = async(
    producerTransport: mediasoup.types.Transport, 
    socket: WebSocket, 
    device: mediasoup.types.Device, 
    meetId: string,
    user: {userKey?: string, userName: string}) => {

    producerTransport.on("connect", async({dtlsParameters}, callback, err) => {
        sendRequest(socket, "connectProducerTransport", {dtlsParameters, meetId, userKey: user.userKey});
        socket.addEventListener( "message" , (event: MessageEvent) => {
            let response = JSON.parse(event.data);
            if(response.type == "producerConnected"){
              callback();
            }
        });
    });

    producerTransport.on("produce", async({kind, rtpParameters}, callback, err) => {
        sendRequest(socket, "produce", {transportId: producerTransport.id,  kind, rtpParameters, meetId, user});

        socket.addEventListener("message", (event: MessageEvent) => {
            let data = JSON.parse(event.data);
            if(data.type == "audioProduced" || data.type == "videoProduced"){
                callback(data.response.producerId);
            }
        })
    });


    if(device.canProduce("video") && device.canProduce("audio")){
     return await getUserMedia({video: true, audio: true}).then( async(stream) => {
            const videotrack = stream.getVideoTracks()[0];
            const audiotrack = stream.getAudioTracks()[0];
            try{
                await producerTransport.produce({track: videotrack});
                await producerTransport.produce({track: audiotrack});
                return stream;
            }catch(error){
                console.log("Can't Produce : ", error);
            }
        });
    }
}

export const onConsumerTransportCreated = async(params: any, device: mediasoup.types.Device) => {
    let transportData: mediasoup.types.TransportOptions = {
        id: params.id,
        dtlsParameters: params.dtlsParameters,
        iceCandidates: params.iceCandidates,
        iceParameters: params.iceParameters,
        sctpParameters: params.sctpParameters
    }

    return device.createRecvTransport(transportData); 

}

export const InitialiseConsumerTransportListener = (consumerTransport: mediasoup.types.Transport, device: mediasoup.Device ,socket: WebSocket, meetId: string, userKey: string) => {

    consumerTransport.on("connectionstatechange", (state) => {
        console.log("connectionstatechange : ", state)
        switch(state){
            case "connected" : 
                sendRequest(socket, "resumeConsumer", {meetId, userKey});
        }
    });
}


export const onConsumed = async(data: {
    consumerId: string,
    kind: mediasoup.types.MediaKind,
    producerId: string,
    producerPaused: boolean,
    rtpParameters: mediasoup.types.RtpParameters,
    type: string
}, consumerTransport: mediasoup.types.Transport) => {
    consumerTransport.on("connectionstatechange", (state) => {
        console.log(state)
    });
    consumerTransport.on("connect", async() => {
        const consumer = await consumerTransport.consume({
            id: data.consumerId,
            producerId: data.producerId,
            kind: data.kind,
            rtpParameters: data.rtpParameters
        });
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
    });
   
}