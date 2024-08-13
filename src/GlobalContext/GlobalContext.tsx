import React, { createContext, ReactElement, ReactNode, RefObject, useContext, useRef, useState } from "react";
import {Device, types as MediasoupTypes} from "mediasoup-client"
import {  InitialiseConnection, InitialiseProducerTransportListener, onConsumerTransportCreated, onProducerTransportCreated, sendRequest } from "../websocket/websocket";


type GlobalContextType = {
    InitialiseMeeting: (data: MeetStateType, meetType: FormType) => void
    meetStateRef: RefObject<MeetStateType | undefined>    
    localStream: MediaStream | undefined  
    participants: ParticipantType | undefined
    audio: boolean
    toggleAudio: (audio: boolean) => void
    video: boolean
    toggleVideo: (video: boolean) => void
    leaveMeeting: () => void
}

type MeetStateType = {
    meetId: string,
    createdAt: string,
    avatar: string,
    currentUser: {
        userName: string,
        userKey: string,
        preference: {
            audio: boolean,
            video: boolean,
            screen: boolean
        }
    }
    host: {
        hostName: string,
        hostKey: string
    }
}

export type ParticipantType = {
    [key: string]: {
        userName: string,
        userKey: string,
        avatar: string,
        preference: {
            audio: boolean,
            video: boolean,
            screen: boolean
        },
        remoteStream: {
            video?: MediaStream,
            audio?: MediaStream
        },
        producer: {
            videoId: string,
            audioId: string
        }
    }
}

export enum FormType {
    CREATE = 'create',
    JOIN = 'join'
}

export const GlobalContext = createContext<GlobalContextType | null>(null);

export function useGlobalState():GlobalContextType {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error("useGlobalContext must be used within an GlobalProvider");
    }
    return context;
}

export const GlobalProvider = (props: {children: ReactNode}):ReactElement => {

    const meetStateRef = useRef<MeetStateType>();
    const socketRef = useRef<WebSocket>();
    
    const participantsRef = useRef<ParticipantType>();
    const [participants, setParticipants] = useState<ParticipantType>();

    const [audio, setAudio] = useState<boolean>(true);
    const [video, setVideo] = useState<boolean>(true);

    const consumerTransport = useRef<MediasoupTypes.Transport | null>(null);
    const producerTransport = useRef<MediasoupTypes.Transport | null>(null);
    const chatTransport = useRef<MediasoupTypes.Transport | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream>();

    const leaveMeeting = () => {
        if(socketRef.current && meetStateRef.current){
            sendRequest(socketRef.current, "leaveMeeting", {meetId: meetStateRef.current?.meetId, userKey: meetStateRef.current.currentUser.userKey});
            window.location.reload();
        }
    }


    const InitialiseMeeting = (data: MeetStateType, meetType: FormType) => {
        meetStateRef.current = data;
        socketRef.current = InitialiseConnection(data.meetId);
        InitSocket(meetType);
    }

    const toggleAudio = (audio: boolean) => {
        if(socketRef.current && meetStateRef.current){
            sendRequest(socketRef.current, "toggleAudio", {meetId: meetStateRef.current.meetId, userKey: meetStateRef.current.currentUser.userKey, audio});
        }
    }

    const toggleVideo = (video: boolean) => {
        if(socketRef.current && meetStateRef.current){
            sendRequest(socketRef.current, "toggleVideo", {meetId: meetStateRef.current.meetId, userKey: meetStateRef.current.currentUser.userKey, video});
        }
    }


    const InitSocket = async(meetType: FormType) => {
        window.addEventListener("beforeunload", () => {
            leaveMeeting();
        });
        window.addEventListener("popstate", () => {
            leaveMeeting();
        });

        if(meetStateRef.current && socketRef.current){
            
            const meetState = meetStateRef.current;
            const socket = socketRef.current;

            socket.onopen = () => {
                console.log("WebSocket Connected!");
                sendRequest(socket, "getRtpCapabilities", {meetId: meetState.meetId});
            }

            const device = new Device();

            socket.onmessage = async(event: MessageEvent) => {
                const message = JSON.parse(event.data);
                console.log("New Message : ", message);
                const type = message.type;
                const response = message.response;
                switch(type){
                    case "rtpCapabilities": 
                        if(meetState.meetId == response.meetId)
                            try{
                                await device.load({routerRtpCapabilities: response.rtpCapabilities}).then(() => {
                                    sendRequest(socket, "createProducerTransport", {
                                        forceTcp: false, 
                                        rtpCapabilities: device,
                                        meetId: meetState.meetId, 
                                        userKey: meetState?.currentUser.userKey
                                    });
                                    // if(meetType == FormType.CREATE){
                                    //     sendRequest(socket, "createChatTransport", {meetId: meetState.meetId});
                                    // }else{
                                    //     sendRequest(socket, "getChatTransport", {meetId: meetState.meetId});
                                    // }
                                    
                                });
                            }catch(Error){

                            }
                    break;

                    case "newUser":
                            if(response.user){
                                const {userKey, userName, preference, producer, avatar} = response.user;
                                participantsRef.current = {...participantsRef.current, [response.user.userKey]: {
                                    userKey,
                                    userName,
                                    preference,
                                    producer,
                                    avatar,
                                    remoteStream: {}
                                }};
                                
                                if(userKey != meetState.currentUser.userKey){
                                    sendRequest(socket, "startConsume", {
                                        kind: "video",
                                        rtpCapabilities: device.rtpCapabilities, 
                                        producerId: producer.videoId, 
                                        producerUserKey: userKey, 
                                        meetId: meetState.meetId, 
                                        userKey: meetState.currentUser.userKey
                                    });
                                    
                                    sendRequest(socket, "startConsume", {
                                        kind: "audio",
                                        rtpCapabilities: device.rtpCapabilities, 
                                        producerId: producer.audioId, 
                                        producerUserKey: userKey, 
                                        meetId: meetState.meetId, 
                                        userKey: meetState.currentUser.userKey
                                    });
                                }
                            }   
                    break;

                    case "removeUser": 
                        if(response.meetId && participantsRef.current?.[response.user.userKey]){
                            delete participantsRef.current?.[response.user.userKey];
                            setParticipants(participantsRef.current);
                        }
                    break;

                    case "endMeeting":
                        window.location.reload();
                    break;

                    case "videoToggled":
                        
                        if(meetStateRef.current && response.userKey == meetStateRef.current?.currentUser.userKey){
                            meetState.currentUser.preference = {...meetState.currentUser.preference, video: response.video}
                            meetStateRef.current.currentUser.preference = {...meetState.currentUser.preference, video: response.video}
                            setVideo(response.video);
                        }
                    break;

                    case "audioToggled":
                        if(meetStateRef.current && response.userKey == meetStateRef.current?.currentUser.userKey){
                            meetState.currentUser.preference = {...meetState.currentUser.preference, audio: response.audio}
                            meetStateRef.current.currentUser.preference = {...meetState.currentUser.preference, audio: response.audio}
                            setAudio(response.audio);
                        }
                    break;

                    case "updatedPreference":
                        if(response.user.userKey && participantsRef.current?.[response.user.userKey]){
                            const participants = { ...participantsRef.current };
                            participants[response.user.userKey].preference = { ...participants[response.user.userKey].preference, ...response.user.preference}
                            participantsRef.current = participants;
                            setParticipants({ ...participants });
                        }
                    break;

                    case "chatTransportCreated":
                        const chatProducer = await onProducerTransportCreated(response.params, device);
                        chatTransport.current = chatProducer;

                    break;

                    case "producerTransportCreated": 
                        const producer = await onProducerTransportCreated(response.params, device);
                        producerTransport.current = producer;
                        if(meetType == FormType.CREATE){
                            const stream = await InitialiseProducerTransportListener(producer, socket, device, meetState.meetId, meetState.currentUser);
                            producerTransport.current.on("connectionstatechange", (state) => {
                                console.log("connectionstatechange : ", state)
                                switch(state){
                                  case "connected":
                                    sendRequest(socket, "createConsumerTransport", {meetId: meetState.meetId, userKey: meetState.currentUser.userKey});
                                    if(stream)
                                        setLocalStream(stream);
                                    break;
                        
                                  case "failed": producerTransport.current?.close();
                                    break;
                                }
                            });

                        }else{
                            sendRequest(socket, "createConsumerTransport", {meetId: meetState.meetId, userKey: meetState.currentUser.userKey});
                            const stream = await InitialiseProducerTransportListener(producer, socket, device, meetState.meetId, meetState.currentUser);
                            producerTransport.current.on("connectionstatechange", (state) => {
                                switch(state){
                                  case "connected":
                                     if(stream)
                                        setLocalStream(stream);
                                    break;
                                  case "failed": producerTransport.current?.close();
                                    break;
                                }
                            });
                        }
                    break;

                    case "consumerTransportCreated":
                        const consumer = await onConsumerTransportCreated(response.params, device); //consumerTransport
                        consumer.on( "connect", ({dtlsParameters}, callback) => {
                            sendRequest(socket, "connectConsumerTransport", {transportId: consumer.id, dtlsParameters, meetId: meetState.meetId, userKey: meetState.currentUser.userKey});
                            socket.addEventListener( "message",  (event: MessageEvent) => {
                                let data = JSON.parse(event.data);
                                if(data.type == "consumerConnected"){
                                    callback();
                                }
                            });
                        });
                        consumerTransport.current = consumer;
                    break;

                    case "consumed":
                    if(consumerTransport.current){
                        let data = {
                            consumerId: response.data.consumerId,
                            producerId: response.data.producerId,
                            kind: response.data.kind,
                            rtpParameters: response.data.rtpParameters
                        }
                        try{
                            await consumerTransport.current.consume({
                                id: data.consumerId,
                                producerId: data.producerId,
                                kind: data.kind,
                                rtpParameters: data.rtpParameters
                            }).then( (consumer) => {
                                switch(consumer.kind){
                                    case "video": 
                                        const videostream = new MediaStream();
                                        videostream.addTrack(consumer.track);
                                        if(response.producerUserKey && participantsRef.current?.[response.producerUserKey]){
                                            const participants = { ...participantsRef.current };
                                            participants[response.producerUserKey].remoteStream.video = videostream;
                                            participantsRef.current = participants;
                                            setParticipants({ ...participants });
                                        }
                                    break;
                                    case "audio":
                                        const audiostream = new MediaStream();
                                        audiostream.addTrack(consumer.track);
                                        if(response.producerUserKey && participantsRef.current?.[response.producerUserKey]){
                                            const participants = { ...participantsRef.current };
                                            participants[response.producerUserKey].remoteStream.audio = audiostream;
                                            participantsRef.current = participants;
                                            setParticipants({ ...participants });
                                        }
                                    break;
                                }
                            });
                        }catch(error){
                            console.log("Consume Error : ", error);
                        }
                        
                    }
                break;

                }
            }
        }
    
    }

   
    return(
    <GlobalContext.Provider value={{ localStream, InitialiseMeeting, meetStateRef, participants, toggleAudio, toggleVideo, audio, video, leaveMeeting}}>
        {props.children}
    </GlobalContext.Provider>
   )
}