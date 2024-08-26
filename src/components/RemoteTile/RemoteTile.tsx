import React, { FunctionComponent, useEffect, useRef, memo, useState } from "react";
import "./RemoteTile.scss";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { Avatar } from "@mui/material";
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import { useGlobalState } from "../../GlobalContext/GlobalContext";

type RemoteProps = {
    userKey: string,
    userName: string
    audio: boolean,
    video: boolean,
    avatar: string,
    isPinned: boolean,
    videoStream: MediaStream
    audioStream?: MediaStream
    screenShare: boolean
    self: boolean
}
const RemoteTile:FunctionComponent<RemoteProps> = ({videoStream, audioStream, userName, userKey, audio, video, avatar, isPinned, screenShare, self}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const {pinVideo} = useGlobalState();

    const [isHovered, setHovered] = useState<boolean>(false);

    useEffect( () => {
        if(videoRef.current && videoStream)
            videoRef.current.srcObject = videoStream;

        if(audioRef.current && audioStream)
            audioRef.current.srcObject = audioStream

    }, [videoStream, audioStream, video, audio]);

    return(
        <div className="remote-user" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
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
            {
                isHovered &&
                <div className="video-pin">
                    {isPinned ? 
                        <div className="pin-icon" onClick={ () => screenShare ? pinVideo(false, userKey, videoStream, self, true) : pinVideo(false, userKey, videoStream, self, false)}>
                            <FlashOffIcon/> 
                        </div>
                        :
                        <div className="pin-icon" onClick={ () => screenShare ? pinVideo(true, userKey, videoStream, self, true) : pinVideo(true, userKey, videoStream, self, false)}>
                           <FlashOnIcon/>
                        </div>
                    }
                </div>
            }
             <audio ref={audioRef} className="remote-video"  autoPlay playsInline></audio>
             <div className="audio-icon"> 
                {(audio && audioStream)? <MicIcon className="mic-icon"/> : <MicOffIcon className="mic-icon"/>}
            </div>
        </div>
       
    )
}

export default RemoteTile;