import React, { FunctionComponent, useEffect, useRef, memo } from "react";
import "./RemoteTile.scss";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { Avatar } from "@mui/material";

type RemoteProps = {
    userName: string
    audio: boolean,
    video: boolean,
    avatar: string,
    videoStream: MediaStream
    audioStream: MediaStream
}
const RemoteTile:FunctionComponent<RemoteProps> = ({videoStream, audioStream, userName, audio, video, avatar}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect( () => {
        if(videoRef.current && videoStream)
            videoRef.current.srcObject = videoStream;

        if(audioRef.current && audioStream)
            audioRef.current.srcObject = audioStream

    }, [videoStream, audioStream, video, audio])
    return(
        <div className="remote-user">
             
            { video  ?
                <>
                    <video ref={videoRef} className="remote-video" muted autoPlay playsInline></video>
                    <h5 className="user-name">{userName}</h5>
                </>
            :
                <div className="remote-avatar">
                    <Avatar className="avatar-icon" sx={{backgroundColor: avatar}}>{userName.charAt(0).toUpperCase() }</Avatar>
                </div>
            }
             <audio ref={audioRef} className="remote-video"  autoPlay playsInline></audio>
             <div className="audio-icon"> 
                {audio ? <MicIcon className="mic-icon"/> : <MicOffIcon className="mic-icon"/>}
            </div>
        </div>
       
    )
}

export default memo(RemoteTile);