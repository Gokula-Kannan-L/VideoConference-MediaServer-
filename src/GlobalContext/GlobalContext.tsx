import React, { createContext, ReactElement, ReactNode, RefObject, SetStateAction, useContext, Dispatch, useRef, useState, useEffect } from "react";
import {Device, types as MediasoupTypes} from "mediasoup-client"
import {  InitialiseConnection, InitialiseConsumerTransportListener, InitialiseProducerTransportListener, InitialiseProducerTransportListenerJoinSession, onConsumerTransportCreated, onProducerTransportCreated, sendRequest } from "../websocket/websocket";


type GlobalContextType = {
    InitialiseMeeting: (data: MeetStateType, meetType: FormType) => void
    meetStateRef: RefObject<MeetStateType | undefined>    
    localVideoRef: RefObject<HTMLVideoElement>
    participants: ParticipantType | undefined
}

type MeetStateType = {
    meetId: string,
    createdAt: string,
    currentUser: {
        userName: string,
        userKey: string
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
        preference: {
            audio: boolean,
            video: boolean,
            screen: boolean
        },
        remoteStream?: MediaStream,
        producerId: string
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

    const localVideoRef = useRef<any>(null);
    const participantsRef = useRef<ParticipantType>();
    const [participants, setParticipants] = useState<ParticipantType>();

    const consumerTransport = useRef<MediasoupTypes.Transport | null>(null);
    const producerTransport = useRef<MediasoupTypes.Transport | null>(null);


    const InitialiseMeeting = (data: MeetStateType, meetType: FormType) => {
        meetStateRef.current = data;
        socketRef.current = InitialiseConnection(data.meetId);
        InitSocket(meetType);
    }

    const InitSocket = async(meetType: FormType) => {
        console.log("Init Socket----------")
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
                                    })
                                });
                            }catch(Error){

                            }
                    break;

                    case "newUser":
                            if(response.user){
                                const {userKey, userName, preference, producerId} = response.user;
                                participantsRef.current = {...participantsRef.current, [response.user.userKey]: {
                                    userKey,
                                    userName,
                                    preference,
                                    producerId
                                }};
                                
                                if(userKey != meetState.currentUser.userKey){
                                    sendRequest(socket, "startConsume", {
                                        rtpCapabilities: device.rtpCapabilities, 
                                        producerId: producerId, 
                                        producerUserKey: userKey, 
                                        meetId: meetState.meetId, 
                                        userKey: meetState.currentUser.userKey
                                    });  
                                }
                                console.log("new User-------------------", participantsRef);
                            }   
                    break;

                    case "producerTransportCreated": 
                        const producer = await onProducerTransportCreated(response.params, device);
                        producerTransport.current = producer;
                        if(meetType == FormType.CREATE){
                            InitialiseProducerTransportListener(producer, socket, device, localVideoRef, meetState.meetId, meetState.currentUser);
                        }else{
                            sendRequest(socket, "createConsumerTransport", {meetId: meetState.meetId, userKey: meetState.currentUser.userKey});
                            InitialiseProducerTransportListenerJoinSession(producer, socket, device, localVideoRef, meetState.meetId, meetState.currentUser);
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
                        console.log("Response ----------11111", response, participantsRef.current);
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
                                const stream = new MediaStream();
                                stream.addTrack(consumer.track);
                                console.log("Response ----------22222", response, participantsRef.current);
                               if(response.producerUserKey && participantsRef.current?.[response.producerUserKey] ){
                                const participants = { ...participantsRef.current };
                                participants[response.producerUserKey] = {
                                    ...participants[response.producerUserKey],
                                    remoteStream: stream
                                };
                               
                                participantsRef.current = participants;
                                console.log("Consume User : ",  participantsRef.current[response.producerUserKey]);
                                setParticipants({ ...participants });
                                console.log("updated Participants : ", participants);
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
    <GlobalContext.Provider value={{ localVideoRef, InitialiseMeeting, meetStateRef, participants}}>
        {props.children}
    </GlobalContext.Provider>
   )
}