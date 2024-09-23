import * as mediasoup from 'mediasoup-client';
import { getDisplayMedia, getUserMedia } from '../helper/helper';

export const InitialiseConnection = () => {
    const url = process.env.REACT_APP_SOCKET_URL;
    if(url){
        const newSocket =  new WebSocket(url);
        return {newSocket};
    }else{
        return {error: "Socket Connection Failed: WebSocket not found."}
    }
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
        return await getUserMedia({video:{width:{ ideal: 1080}, height:{ ideal: 720}}, audio: true}).then( async(stream) => {
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

export const InitialiseUpdateProducerTransportListener = async(
    producerTransport: mediasoup.types.Transport, 
    socket: WebSocket,
    device: mediasoup.types.Device, 
    meetId: string,
    user: {userKey?: string, userName: string, userId: string, avatarKey: string}) => {
    
    producerTransport.on("connect", async({dtlsParameters}, callback, err) => {
        sendRequest(socket, "connectUpdateProducerTransport", {dtlsParameters, meetId, userKey: user.userKey});
        socket.addEventListener( "message" , (event: MessageEvent) => {
            let response = JSON.parse(event.data);
            if(response.type == "updateProducerConnected"){
              callback();
            }
        });
    });

    producerTransport.on("produce", async({kind, rtpParameters}, callback, err) => {
        sendRequest(socket, "updateProduce", {transportId: producerTransport.id,  kind, rtpParameters, meetId, user});

        socket.addEventListener("message", (event: MessageEvent) => {
            let data = JSON.parse(event.data);
            if(data.type == "audioProduced" || data.type == "videoProduced"){
                callback(data.response.producerId);
            }
        })
    });

    if(device.canProduce("video")){
        return await getUserMedia({video:{width:{ ideal: 1080}, height:{ ideal: 720}}, audio: true}).then( async(stream) => {
            const videotrack = stream.getVideoTracks()[0];
            try{
                await producerTransport.produce({track: videotrack});
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