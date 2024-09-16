import { Avatar } from "@mui/material";
import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import "./VideoTile.scss";
import {FlashOn, FlashOff, MicOff, Mic} from '@mui/icons-material';
import { useGlobalState } from "../../GlobalContext/GlobalContext";

type VideoTileProps = {
    tileType: TileType
    width: string,
    height: string,
    userName: string,
    userKey: string,
    userId: string,
    avatarColorCode: string,
    videoEnabled: boolean,
    videoStream: MediaStream | null,
    audioEnabled: boolean,
    screenShareEnabled: boolean,
    audioStream: MediaStream | null,
    isPinned: boolean
}

export enum TileType{
    local = "LOCAL",
    remote = "REMOTE",
    screenShare = "SCREEN"
}

const VideoTile:FunctionComponent<VideoTileProps> = ({
        tileType,
        width, 
        height, 
        userName,
        userKey,
        userId,
        avatarColorCode,
        videoEnabled, 
        audioEnabled,
        screenShareEnabled,
        videoStream, 
        audioStream,
        isPinned
    }) => {

    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const {pinVideoToMainTile, isHost, muteUsers} = useGlobalState();
    const [isHovered, setIsHovered] = useState<boolean>(false);

    useEffect(() => {
        if(audioStream && audioRef.current){
            audioRef.current.srcObject = audioStream;
        }
        if(videoStream && videoRef.current){
            videoRef.current.srcObject = videoStream;
        }
        console.log(videoRef.current)
    }, [audioEnabled, videoEnabled, audioStream, videoStream]);
    
    return(
        <div className="videotile-container" style={{width, height}} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {screenShareEnabled ? 
                <video ref={videoRef} className="video-element" muted autoPlay playsInline style={{width, height, objectFit: 'cover'}}></video> : 
                <>
                { videoEnabled ? 
                    <video ref={videoRef} className="video-element" muted autoPlay playsInline style={{width, height, objectFit: 'cover', transform: "rotateY(180deg)"}}></video> :
                    <div className="remote-avatar" style={{width, height}}>
                        <Avatar className="avatar-icon" sx={{backgroundColor: avatarColorCode}}>{userName.charAt(0).toUpperCase() }</Avatar>
                    </div>
                }
             
                </>
            }
            {(videoEnabled || screenShareEnabled) && <h5 className="user-name">{userName}</h5>}
            {audioEnabled &&  tileType == TileType.remote && <audio ref={audioRef} className="audio-element"  autoPlay playsInline></audio>}
            {
                isHovered &&
                <div className="video-pin">
                    <div className="icon-wrappper">
                        {isPinned ? 
                            <div className="pin-icon" onClick={() => pinVideoToMainTile({
                                pin: false, userKey, userId, userName, isCurrentUser: tileType==TileType.local ? true : false, videoStream, type: screenShareEnabled ? 'screen' : 'video' })}>
                                <FlashOff/> 
                            </div>
                            :
                            <div className="pin-icon" onClick={() => pinVideoToMainTile({
                                pin: true, userKey, userId, userName, isCurrentUser: tileType==TileType.local ? true : false, videoStream, type: screenShareEnabled ? 'screen' : 'video' })}>
                            <FlashOn/>
                            </div>
                        }
                        {isHost ?
                            <>
                            {(audioEnabled && audioStream && !screenShareEnabled)? <div className="pin-icon" onClick={() => muteUsers(userKey)}><Mic/></div> : <MicOff className="pin-icon"/>}
                            </>
                            :
                            <>
                            {(audioEnabled && audioStream && !screenShareEnabled)? <div className="mute-icon" onClick={() => muteUsers(userKey)}><Mic/></div> : <MicOff className="mute-icon"/>}
                            </>
                        }
                    </div>
                </div>
            }
           {tileType == TileType.remote && <div className="audio-icon"> 
                {(audioEnabled && audioStream)? <Mic className="mic-icon"/> : <MicOff className="mic-icon"/>}
            </div>}
        </div>
    )
}

export default VideoTile