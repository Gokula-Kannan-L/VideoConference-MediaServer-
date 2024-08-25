import React, { createContext, ReactElement, ReactNode, RefObject, useContext, useEffect, useRef, useState } from "react";
import {Device, types as MediasoupTypes} from "mediasoup-client";
import MediaSoup from 'mediasoup-client';

import { InitialiseConnection, InitialiseProducerTransportListener, InitialiseScreenTransportListener, onConsumerTransportCreated, onProducerTransportCreated, sendRequest } from "../websocket/websocket";
import { getDisplayMedia, getUserMedia } from "../helper/helper";


type GlobalContextType = {
    InitialiseMeeting: (data: MeetStateType, meetType: FormType) => void
    meetStateRef: RefObject<MeetStateType | undefined>    
    localStream: MediaStream | undefined  
    participants: ParticipantType | undefined
    audio: boolean
    toggleAudio: (audio: boolean) => void
    video: boolean
    toggleVideo: (video: boolean) => void
    isScreenSharing: boolean
    displayStream: MediaStream | undefined  
    handleScreenShare: () => void
    stopScreenShare: () => void
    pinVideo: (pin: boolean, userKey: string, self?: boolean) => void
    mainTileInfo: { message: string, stream: MediaStream, pinnedUser: { userName: string,
        userKey: string,
        avatar: string,
        isPinned: boolean,
        preference: {
            audio: boolean,
            video: boolean,
            screen: boolean
        }, } | null} | null,
    chatMessages: MessageType | undefined
    startRecording: () => void
    stopRecording: () => void
    sendMessage: (message: string) => void
    leaveMeeting: () => void
}

type MeetStateType = {
    meetId: string,
    createdAt: string,
    avatar: string,
    currentUser: {
        userName: string,
        userKey: string,
        contentShareKey?: string
        isPinned: boolean,
        preference: {
            audio: boolean,
            video: boolean,
            screen: boolean
        }
    }
    host: {
        hostName: string,
        hostKey: string
    },
}

export type ParticipantType = {
    [key: string]: {
        userName: string,
        userKey: string,
        avatar: string,
        isPinned: boolean,
        preference: {
            audio: boolean,
            video: boolean,
            screen: boolean
        },
        remoteStream: {
            video?: MediaStream,
            audio?: MediaStream
        },
        screenShare: {
            displayStream?: MediaStream,
            screenId?: string,
        }
        producer: {
            videoId: string,
            audioId: string
        }
    }
}

type MessageType = {
    [key: string]: {
        userKey: string,
        userName: string,
        message: string,
        createdAt: string
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
    const screenTransport = useRef<MediasoupTypes.Transport | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream>();

    const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
    const [displayStream, setDisplayStream] = useState<MediaStream>();
    const [mainTileInfo, setMainTileInfo] = useState<{
        message: string,
        stream: MediaStream,
        pinnedUser: {
            userName: string,
            userKey: string,
            avatar: string,
            isPinned: boolean,
            preference: {
                audio: boolean,
                video: boolean,
                screen: boolean
            }
        } | null
    } | null >(null);


    useEffect( () => {
        console.log(participants, meetStateRef.current, isScreenSharing, displayStream);

        if(meetStateRef.current?.host.hostKey == meetStateRef.current?.currentUser.userKey && isScreenSharing && displayStream){
            setMainTileInfo({
                message: "You're presenting the screen",
                stream: displayStream,
                pinnedUser: null
            });
            if(participants){
                Object.keys(participants).forEach( (key) => {
                    if(key == meetStateRef.current?.host.hostKey){
                        participants[meetStateRef.current?.host.hostKey].isPinned = true;
                    }else{
                        participants[key].isPinned = false;
                    }
                })
            }
    
        }else if(participants && meetStateRef.current?.host.hostKey != meetStateRef.current?.currentUser.userKey ){
            let screenShareInfo: {
                message: string,
                stream: MediaStream,
                pinnedUser: null
            } | null = null;
            Object.keys(participants).forEach((key) => {
                const host = participants[key];
                if(key == meetStateRef.current?.host.hostKey && host.preference.screen && host.screenShare.displayStream){
                    screenShareInfo = {
                        message: `${participants[key].userName} is presenting the screen`,
                        stream: host.screenShare.displayStream,
                        pinnedUser: null
                    }
                    participants[key].isPinned =true;
                }else{
                    participants[key].isPinned =false;
                }
            });
            if(screenShareInfo){
                setMainTileInfo(screenShareInfo);
            }else{
                if(isScreenSharing && displayStream){
                    setMainTileInfo({
                        message: "You're presenting the screen",
                        stream: displayStream,
                        pinnedUser: null
                    });
                }else
                    setMainTileInfo(null);
            }
        }else if(isScreenSharing && displayStream){
            setMainTileInfo({
                message: "You're presenting the screen",
                stream: displayStream,
                pinnedUser: null
            });
        }else{
            setMainTileInfo(null);
        }

    }, [displayStream, isScreenSharing, participants])

    const chatMessageRef = useRef<MessageType>();
    const [chatMessages, setChatMessage] = useState<MessageType>();

    const deviceRef = useRef<Device>();

    const startRecording = () => {
        if(socketRef.current && meetStateRef.current){
            sendRequest(socketRef.current, "startRecording", {meetId: meetStateRef.current.meetId});
        }
    };

    const stopRecording = () => {
        if(socketRef.current && meetStateRef.current){
            sendRequest(socketRef.current, "stopRecording", {meetId: meetStateRef.current.meetId});
        }
    };

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

    const toggleVideo = async(video: boolean) => {
        if(socketRef.current && meetStateRef.current){
            if(video && producerTransport.current){
                await getUserMedia({video: true, audio: true}).then( async(stream) => {
                    const videotrack = stream.getVideoTracks()[0];
                    try{
                        await producerTransport.current?.produce({track: videotrack});
                    }catch(error){
                        console.log("Can't Produce : ", error);
                    }
                });
            }
            sendRequest(socketRef.current, "toggleVideo", {meetId: meetStateRef.current.meetId, userKey: meetStateRef.current.currentUser.userKey, video});
        }
    }

    const pinVideo = (pin: boolean, userKey: string, self?: boolean) => {
        console.log(participants, userKey)
        if(self){
            if(pin && meetStateRef.current){
                meetStateRef.current.currentUser.isPinned = true;
                if(isScreenSharing && displayStream){
                    setMainTileInfo({
                        message: `you're presenting your screen`,
                        stream: displayStream,
                        pinnedUser: null
                    });
                }else{
                    if(localStream && meetStateRef.current)
                        setMainTileInfo({
                            message: `your video is pinned`,
                            stream: localStream,
                            pinnedUser: {
                                userKey: meetStateRef.current?.currentUser.userKey,
                                userName: meetStateRef.current?.currentUser.userName,
                                avatar: meetStateRef.current.avatar,
                                isPinned: meetStateRef.current.currentUser.isPinned,
                                preference: meetStateRef.current.currentUser.preference
                            }
                        });
                }
            }else{
                if(meetStateRef.current){
                    meetStateRef.current.currentUser.isPinned = false;
                    setMainTileInfo(null);
                }
               
            }
            
        }
        else if(participants && pin){
            Object.keys(participants).forEach((key) => {
                let user = participants[key];
                if(key == userKey){
                    participants[key].isPinned = true;
                    if(user.preference.screen && user.screenShare.displayStream){
                        setMainTileInfo({
                            message: `${user.userName} is presenting the screen`,
                            stream: user.screenShare.displayStream,
                            pinnedUser: null
                        });
                    }else if(user && user.remoteStream.video){
                        setMainTileInfo({
                            message: `${user.userName} video is pinned`,
                            stream: user.remoteStream.video,
                            pinnedUser: user
                        });
                    }
                }else{
                    participants[key].isPinned = false;
                }
            })
        }else if(!pin && participants?.[userKey]){
            setMainTileInfo(null);
            if(userKey == meetStateRef.current?.host.hostKey){
                participants[userKey].isPinned = false;
            }else{
                let update = {...participants};
                update[userKey].isPinned = false;
                setParticipants(update);
            }
        }
    }

    const handleScreenShare = async() => {
        const transport = screenTransport.current;
        await getDisplayMedia({video: true, audio: false}).then( async(displayStream) => {
            if(displayStream){
                setDisplayStream(displayStream);
            
                if(transport){
                    await transport.produce({track: displayStream.getVideoTracks()[0], encodings: [{
                        scalabilityMode: "L1T3"
                    }]});
                }
                displayStream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                }
            }
        });
    }

    const stopScreenShare = async() => {
        if(socketRef.current && meetStateRef.current){
            displayStream?.getVideoTracks()[0].stop();
            setDisplayStream(undefined);
            setIsScreenSharing(false);
            sendRequest(socketRef.current, "stopScreenShare", {
                meetId: meetStateRef.current.meetId, 
                userKey: meetStateRef.current.currentUser.userKey, 
                contentShareKey: meetStateRef.current.currentUser.contentShareKey});
        }
           
    }

    const sendMessage = (message: string) => {
        if(socketRef.current && meetStateRef.current){
            const {meetId, currentUser} = meetStateRef.current
            sendRequest(socketRef.current, "sendMessage", {meetId, userKey: currentUser.userKey, userName: currentUser.userName, message});
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
                                    sendRequest(socket, "createScreenTransport", {
                                        forceTcp: false, 
                                        rtpCapabilities: device,
                                        meetId: meetState.meetId, 
                                        userKey: meetState?.currentUser.userKey
                                    });
                                    deviceRef.current = device;
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
                                    isPinned: false,
                                    remoteStream: {},
                                    screenShare: {}
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

                    case "newMessage":
                        if(response.newMessage){
                            const newMessage: MessageType = {
                                [response.newMessage.messageKey]: {
                                    userKey: response.newMessage.userKey,
                                    userName: response.newMessage.userName,
                                    message: response.newMessage.message,
                                    createdAt: response.newMessage.createdAt,
                                }
                            };
                            chatMessageRef.current = {...chatMessageRef.current, ...newMessage};
                            setChatMessage(chatMessageRef.current);
                        }
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

                    case "screenVideoProduced":
                        if(meetStateRef.current){
                            meetState.currentUser.preference.screen = true;
                            meetStateRef.current.currentUser.preference.screen = true;
                            setIsScreenSharing(true);
                        }
                    break;

                    case "newScreenShare":
                        if(response.screenShareInfo.userKey == meetState.currentUser.userKey && meetStateRef.current){
                            meetState.currentUser.contentShareKey = response.screenShareInfo.contentShareKey;
                            meetStateRef.current.currentUser.contentShareKey = response.screenShareInfo.contentShareKey;
                        }

                        if(response.screenShareInfo.userKey != meetState.currentUser.userKey && participantsRef.current?.[response.screenShareInfo.userKey] && response.screenShareInfo.screenId){
                            const participants = { ...participantsRef.current };
                            sendRequest(socket, "consumeScreenShare", {
                                kind: "video",
                                rtpCapabilities: device.rtpCapabilities, 
                                producerId: response.screenShareInfo.screenId, 
                                producerUserKey: response.screenShareInfo.userKey, 
                                meetId: meetState.meetId, 
                                userKey: meetState.currentUser.userKey
                            });

                            participants[response.screenShareInfo.userKey].screenShare.screenId = response.screenShareInfo.screenId;
                            participants[response.screenShareInfo.userKey].preference.screen = true;
                            participantsRef.current = participants;
                            setParticipants({ ...participants });
                        }
                    break;

                    case "endScreenShare":
                        if(response.screenShareInfo.userKey == meetState.currentUser.userKey && meetStateRef.current){
                            meetState.currentUser.preference.screen = false;
                            meetStateRef.current.currentUser.preference.screen = false;
                        }
                        if(response.screenShareInfo.userKey != meetState.currentUser.userKey && participantsRef.current?.[response.screenShareInfo.userKey] ){
                            const participants = { ...participantsRef.current };
                            participants[response.screenShareInfo.userKey].preference.screen = false;
                            participantsRef.current = participants;
                            setParticipants({ ...participants });
                        }

                    break;
                    
                    case "screenShareConsumed":
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
                                                participants[response.producerUserKey].screenShare.displayStream = videostream;
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

                    case "screenTransportCreated":
                        const screenProducer = await onProducerTransportCreated(response.params, device);
                        screenTransport.current = screenProducer;
                        InitialiseScreenTransportListener(screenProducer, socket, meetState.meetId, meetState.currentUser);
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
                                console.log("State...................", state);
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
    <GlobalContext.Provider value={{ localStream, InitialiseMeeting, meetStateRef, participants, toggleAudio, toggleVideo, audio, video, pinVideo, isScreenSharing, displayStream, mainTileInfo, chatMessages, startRecording, stopRecording,sendMessage, leaveMeeting, handleScreenShare, stopScreenShare}}>
        {props.children}
    </GlobalContext.Provider>
   )
}