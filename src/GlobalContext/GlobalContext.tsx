import React, { createContext, Dispatch, ReactElement, ReactNode, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import {Device, types as MediasoupTypes} from "mediasoup-client";
import { InitialiseBlankTransportListener, InitialiseConnection, InitialiseProducerTransportListener, InitialiseScreenTransportListener, onConsumerTransportCreated, onProducerTransportCreated, sendRequest } from "../websocket/websocket";
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
    toaster: boolean
    dialogOpen: boolean
    setDialogOpen: Dispatch<SetStateAction<boolean>>
    toasterMsg: string
    presenter: MainTileType | null
    isScreenSharing: boolean
    isRecording: boolean
    displayStreamRef: RefObject<MediaStream | null>  
    handleScreenShare: () => void
    startScreenShare: () => void
    stopScreenShare: () => void
    pinVideoToMainTile: (data: PinVideoType) => void
    chatMessages: MessageType | undefined
    startRecording: () => void
    stopRecording: () => void
    sendMessage: (message: string) => void
    leaveMeeting: () => void
}

export type MeetStateType = {
    meetId: string,
    createdAt: string,
    avatar: string,
    currentUser: {
        userId: string,
        userName: string,
        userKey: string,
        avatarKey: string,
        contentShareKey?: string,
        contentShareId?: string,
        isPinned: {screen: boolean, video: boolean},
        preference: {
            audio: boolean,
            video: boolean,
            screen: boolean
        }
    }
    host: {
        hostId: string,
        hostName: string,
        hostKey: string
    },
}

export type ParticipantType = {
    [key: string]: {
        userId: string,
        userName: string,
        userKey: string,
        avatarKey: string,
        avatar: string,
        isPinned: {
            video: boolean,
            screen: boolean
        },
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

export type MainTileType = {
    userName: String, 
    userId: String, 
    videoStream: MediaStream,
    title: string,
    pinType:{
        screen: boolean,
        video: boolean
    },
    preference: {
        audio: boolean,
        video: boolean,
        screen: boolean
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

type PinVideoType = {
    pin: boolean, 
    userKey: string,
    userId: string,
    userName: string, 
    videoStream: MediaStream, 
    isCurrentUser: boolean, 
    type: string,
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
    const [presenter, setPresenter] = useState<MainTileType | null>(null); //Main Tile
    const presenterRef = useRef<MainTileType | null>(null);

    const [toaster, setToaster] = useState<boolean>(false);
    const [toasterMsg, setToasterMsg] = useState<string>("");
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    
    const participantsRef = useRef<ParticipantType>();
    const [participants, setParticipants] = useState<ParticipantType>();

    const [audio, setAudio] = useState<boolean>(true);
    const [video, setVideo] = useState<boolean>(true);

    const consumerTransport = useRef<MediasoupTypes.Transport | null>(null);
    const producerTransport = useRef<MediasoupTypes.Transport | null>(null);
    const screenTransport = useRef<MediasoupTypes.Transport | null>(null);
    const blankTransport = useRef<MediasoupTypes.Transport | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream>();

    const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
    const displayStreamRef = useRef<MediaStream | null>(null);
   
    const chatMessageRef = useRef<MessageType>();
    const [chatMessages, setChatMessage] = useState<MessageType>();

    const deviceRef = useRef<Device>();
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingData, setRecordingData] = useState<{userName: string, userId: string, fileName: string} | null>(null);

    const startRecording = async() => {
        if(socketRef.current && meetStateRef.current && blankTransport.current){
            sendRequest(socketRef.current, "startRecording", {meetId: meetStateRef.current.meetId, userKey: meetStateRef.current.currentUser.userKey});
        }
    };

    const stopRecording = () => {
        if(socketRef.current && meetStateRef.current){
            sendRequest(socketRef.current, "stopRecording", {meetId: meetStateRef.current.meetId, fileName: recordingData?.fileName});
        }
    };

    const leaveMeeting = () => {
        if(socketRef.current && meetStateRef.current){
            sendRequest(socketRef.current, "leaveMeeting", {
                meetId: meetStateRef.current?.meetId, 
                userKey: meetStateRef.current.currentUser.userKey, 
                userId: meetStateRef.current.currentUser.userId,
                fileName: recordingData?.fileName
            });
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
            sendRequest(socketRef.current, "toggleVideo", {meetId: meetStateRef.current.meetId, userKey: meetStateRef.current.currentUser.userKey, video});
        }
    }

    const pinVideoToMainTile = (data: PinVideoType) => {
        const {pin, userId, userKey, userName, isCurrentUser, videoStream, type} = data;
        if(isCurrentUser){
            if(meetStateRef.current){
                if(pin){
                    let presenter = {
                        userId,
                        userName,
                        videoStream,
                        title: type == "screen" ? "You're presenting now." :  `You (${userName})`,
                        pinType: type == "screen" ? {screen: pin, video: false} : {screen: false, video: pin},
                        preference: meetStateRef.current.currentUser.preference
                    }
                    setPresenter(presenter);
                    presenterRef.current = presenter;
                }
                    
                
                meetStateRef.current.currentUser.isPinned = type == "screen" ? {screen: pin, video: false}  : {screen: false , video: pin}
            }
            if(participants){
                Object.keys(participants).forEach((key) => {
                    let user = participants[key];
                    user.isPinned = {
                        video: false,
                        screen: false
                    }
                });
            }
        }else{
            if(participants){
                Object.keys(participants).forEach((key) => {
               
                    if(key == userKey){
                        participants[key].isPinned = type == "screen" ? {video: false, screen: pin} : {video: pin, screen: false}
                        if(pin){
                            let presenter = {
                                userId,
                                userName,
                                videoStream,
                                title: type == "screen" ? `${userName} is presenting now.` : `${userName}`,
                                pinType: type == "screen" ? {video: false, screen: pin} : {video: pin, screen: false},
                                preference: participants[key].preference
                            }
                            presenterRef.current = presenter
                            setPresenter(presenter);
                        }
                            
                    }
                });
            }
            
            if(meetStateRef.current){
                meetStateRef.current.currentUser.isPinned = {
                    video: false,
                    screen: false
                }
            }
        }
        if(!pin){
            setPresenter(null);
            presenterRef.current = null;
        }
        
    }

    const updatePresenter = (data: {userId: string, userKey: string, preference: {[key: string] : boolean}}) => {
        const {userId, preference} = data;
       
        if(presenterRef.current && presenterRef.current.userId == userId){
            let update = {...presenterRef.current};
            let key = Object.keys(preference)[0];
            switch(key){
                case "video": 
                    update.preference.video = preference[key];
                    setPresenter(update);
                    presenterRef.current = update;
                break;  
            }
        }
    }

    const handleScreenShare = async() => {
        if(socketRef.current)
            sendRequest(socketRef.current, "getPresenters", { 
                meetId: meetStateRef.current?.meetId, 
                userKey: meetStateRef.current?.currentUser.userKey, 
                userName: meetStateRef.current?.currentUser.userName
            });
    }

    const startScreenShare = async() => {
        const transport = screenTransport.current;
        await getDisplayMedia({video: true, audio: false}).then( async(displayStream) => {
            if(displayStream && meetStateRef.current){
                setDialogOpen(false);
                displayStreamRef.current = displayStream;
                let presenter = {
                    userId: meetStateRef.current.currentUser.userId,
                    userName: meetStateRef.current.currentUser.userName,
                    videoStream: displayStream,
                    title: "You're presenting now.",
                    pinType: {
                        screen: true,
                        video: false
                    },
                    preference: meetStateRef.current.currentUser.preference
                }
                presenterRef.current = presenter;
                setPresenter(presenter);
                if(transport){
                        await transport.produce({track: displayStream.getVideoTracks()[0]});
                }
                displayStream.getVideoTracks()[0].onended = () => {
                    stopScreenShare();
                }
            }
        });
    }

    const stopScreenShare = async() => {
        if(socketRef.current && meetStateRef.current && displayStreamRef.current){
            displayStreamRef.current.getVideoTracks()[0].stop();
            displayStreamRef.current = null;
            setIsScreenSharing(false);
            sendRequest(socketRef.current, "stopScreenShare", {
                meetId: meetStateRef.current.meetId, 
                userKey: meetStateRef.current.currentUser.userKey, 
                userId: meetStateRef.current.currentUser.userId,
                contentShareKey: meetStateRef.current.currentUser.contentShareKey,
                fileName: recordingData?.fileName ? recordingData.fileName : `meet${meetStateRef.current.meetId}-${meetStateRef.current.currentUser.contentShareId}`
            }
            );
            sendRequest(socketRef.current, "stopRecording", {
                meetId: meetStateRef.current.meetId, 
                fileName: recordingData?.fileName ? recordingData.fileName : `meet${meetStateRef.current.meetId}-${meetStateRef.current.currentUser.contentShareId}`
            }
            );
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
                    case "failed":
                        if(response.message){
                            setToasterMsg(response.message);
                            setTimeout( () => {
                                setToaster(true);
                            }, 1000);
                        }
                    break;
                    
                    case "recordingStarted": 
                        if(response.meetId && response.recordData){
                            setIsRecording(true);
                            setRecordingData({
                                userId: response.recordData.userId,
                                userName: response.recordData.userName,
                                fileName: response.recordData.fileName,
                            });
                            setToasterMsg("Recording Started");
                            setTimeout( () => {
                                setToaster(true);
                            }, 1000);
                        }
                    break;

                    case "recordingStopped": 
                        if(response.meetId){
                            setIsRecording(false);
                            setToasterMsg("Recording Stopped");
                            setTimeout( () => {
                                setToaster(true);
                            }, 1000);
                        }
                    break;

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
                                    sendRequest(socket, "createRecordTransport", {
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
                                const {userId, userKey, userName, avatarKey, preference, producer, avatar} = response.user;
                                participantsRef.current = {...participantsRef.current, [response.user.userKey]: {
                                    userId,
                                    userKey,
                                    userName,
                                    avatarKey,
                                    preference,
                                    producer,
                                    avatar,
                                    isPinned: {video: false, screen: false},
                                    remoteStream: {},
                                    screenShare: {}
                                }};
                                
                                if(userId != meetState.currentUser.userId){
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
                        console.log(meetStateRef.current)
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
                            updatePresenter(response.user);
                        }
                    break;

                    case "presentersCount":
                        if(response.count <3){
                            if(presenterRef.current && presenterRef.current.pinType.screen){
                                setDialogOpen(true);
                            }else{
                                startScreenShare();
                            }
                        }else{
                            setToasterMsg("Limit Exceed:3, Can't screen share now.");
                            setToaster(true);
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
                            meetStateRef.current.currentUser.contentShareId = response.screenShareInfo.screenId;
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
                           
                            let presenter: MainTileType | null = null;
                            if(participantsRef.current){
                                Object.keys(participantsRef.current).forEach((key) => {
                                    if(participantsRef.current && participantsRef.current[key]){
                                        let user = participantsRef.current?.[key];
                                        if(user.preference.screen && user.screenShare.displayStream){
                                            presenter = {
                                                userId: user.userId,
                                                userName: user.userName,
                                                videoStream: user.screenShare.displayStream,
                                                title: `${user.userName} is presenting`,
                                                pinType: {
                                                    screen: true,
                                                    video: false
                                                },
                                                preference: user.preference
                                            }
                                        }
                                    }
                                });
                            }
                            presenterRef.current = presenter;
                            setPresenter(presenter);
                        }
                        if(response.screenShareInfo.userKey != meetState.currentUser.userKey && participantsRef.current?.[response.screenShareInfo.userKey] ){
                            const participants = { ...participantsRef.current };
                            participants[response.screenShareInfo.userKey].preference.screen = false;
                            participantsRef.current = participants;
                            setParticipants({ ...participants });
                            let presenter: MainTileType | null = null;
                          
                            if(meetStateRef.current && meetStateRef.current.currentUser.preference.screen && displayStreamRef.current){
                                presenter = {
                                    userId: meetStateRef.current.currentUser.userId,
                                    userName: meetStateRef.current.currentUser.userName,
                                    videoStream: displayStreamRef.current,
                                    title: "You're presenting now.",
                                    pinType: {
                                        screen: true,
                                        video: false
                                    },
                                    preference: meetStateRef.current.currentUser.preference
                                }
                            }else{
                                if(participantsRef.current){
                                    Object.keys(participantsRef.current).forEach((key) => {
                                        if(participantsRef.current && participantsRef.current[key]){
                                            let user = participantsRef.current?.[key];
                                            if(user.preference.screen && user.screenShare.displayStream){
                                                presenter = {
                                                    userId: user.userId,
                                                    userName: user.userName,
                                                    videoStream: user.screenShare.displayStream,
                                                    title: `${user.userName} is presenting`,
                                                    pinType: {
                                                        screen: true,
                                                        video: false
                                                    },
                                                    preference: user.preference
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                            presenterRef.current = presenter;
                            setPresenter(presenter);
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
                                                participants[response.producerUserKey].isPinned = {screen: true, video: false};
                                                participantsRef.current = participants;
                                                setParticipants({ ...participants });
                                                let presenter = {
                                                    userId: participants[response.producerUserKey].userId,
                                                    userName: participants[response.producerUserKey].userName,
                                                    videoStream: videostream,
                                                    title: `${participants[response.producerUserKey].userName} is presenting`,
                                                    pinType: {
                                                        screen: true,
                                                        video: false
                                                    },
                                                    preference: participants[response.producerUserKey].preference
                                                };
                                                setPresenter(presenter);
                                                presenterRef.current = presenter;
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

                    case "blankTransportCreated":
                        const blankProducer = await onProducerTransportCreated(response.params, device);
                        blankTransport.current = blankProducer;
                        InitialiseBlankTransportListener(blankProducer, socket, meetState.meetId, meetState.currentUser);
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
    <GlobalContext.Provider 
        value={{
            localStream, 
            InitialiseMeeting, 
            meetStateRef, 
            participants, 
            toggleAudio, 
            toggleVideo, 
            audio, 
            video,
            presenter,
            dialogOpen,
            setDialogOpen,
            toaster,
            toasterMsg,
            pinVideoToMainTile, 
            isScreenSharing,
            isRecording,
            displayStreamRef,
            chatMessages, 
            startRecording, 
            stopRecording,
            sendMessage, 
            leaveMeeting, 
            handleScreenShare, 
            startScreenShare,
            stopScreenShare}}>
        {props.children}
    </GlobalContext.Provider>
   )
}