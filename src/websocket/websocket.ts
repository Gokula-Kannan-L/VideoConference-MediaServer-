import * as mediasoup from 'mediasoup-client';
import { getUserMedia } from '../helper/helper';
import { RefObject } from 'react';

export const InitialiseConnection = (meetId: string) => {
    const newSocket =  new WebSocket(`ws://localhost:8000/meet?meetId=${meetId}`);
    // const newSocket =  new WebSocket("https://di1dg9cpmtx4i.cloudfront.net/ws");
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
        sctpParameters: params.sctpParameters
    }

    return device.createSendTransport(transportData);
}

export const InitialiseProducerTransportListener = (
    producerTransport: mediasoup.types.Transport, 
    socket: WebSocket, 
    device: mediasoup.types.Device, 
    localVideoRef: RefObject<HTMLVideoElement>,
    meetId: string,
    user: {userKey?: string, userName: string}) => {
    
    let localstream: MediaStream;

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
            if(data.type == "produced"){
                console.log("Produced : ", data);
                callback(data.response.producerId);
            }
        })
    });

    producerTransport.on("connectionstatechange", (state) => {
        console.log("connectionstatechange : ", state)
        switch(state){
          case "connected":
                if(localstream && localVideoRef.current){
                    localVideoRef.current.srcObject = localstream;
                    sendRequest(socket, "createConsumerTransport", {meetId, userKey: user.userKey});
                }
            break;

          case "failed": producerTransport.close();
            break;
        }
    });

    if(device.canProduce("video")){
        getUserMedia({video: true, audio: true}).then( async(stream) => {
            localstream = stream;
            const track = stream.getVideoTracks()[0];
            try{
                await producerTransport.produce({track});
            }catch(error){
                console.log("Can't Produce : ", error);
            }
        });
    }

}

export const InitialiseProducerTransportListenerJoinSession = (
    producerTransport: mediasoup.types.Transport, 
    socket: WebSocket, 
    device: mediasoup.types.Device, 
    localVideoRef: RefObject<HTMLVideoElement>,
    meetId: string,
    user: {userKey?: string, userName: string}) => {
    
    let localstream: MediaStream;

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
            if(data.type == "produced"){
                console.log("Produced : ", data);
                callback(data.response.producerId);
            }
        })
    });

    producerTransport.on("connectionstatechange", (state) => {
        switch(state){
          case "connected":
                if(localstream && localVideoRef.current){
                    localVideoRef.current.srcObject = localstream;
                    // sendRequest(socket, "createConsumerTransport", {meetId, userKey: user.userKey});
                }
                   
            break;
          case "failed": producerTransport.close();
            break;
        }
    });

    if(device.canProduce("video")){
        getUserMedia({video: true, audio: true}).then( async(stream) => {
            localstream = stream;
            const track = stream.getVideoTracks()[0];
            try{
                await producerTransport.produce({track});
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
        console.log("Consumer Track : ", consumer.track);
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        console.log("New Stream : ", stream);
    });
   
}