import React, { FunctionComponent, RefObject, useEffect, useRef, useState } from "react";
import "./LocalTile.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { Avatar } from "@mui/material";
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';

const LocalTile: FunctionComponent = () => {
    const {meetStateRef, audio, video, localStream, pinVideo} = useGlobalState();
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [isHovered, setHovered] = useState<boolean>(false);

    useEffect( () => {
        if(localStream && videoRef.current)
            videoRef.current.srcObject = localStream
    }, [localStream, video])
    return(
        <div className="local-tile" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            { video  ?
            <>
                <video ref={videoRef} className="local-video" muted autoPlay playsInline></video>
                <h5 className="user-name">You ({meetStateRef.current?.currentUser.userName})</h5>
            </>
             :
            <div className="local-avatar">
                <Avatar className="avatar-icon" sx={{backgroundColor: meetStateRef.current?.avatar}}>{meetStateRef.current?.currentUser.userName.charAt(0).toUpperCase() }</Avatar>
            </div>
            }
            {isHovered && <div className="video-pin">
                {localStream && meetStateRef.current?.currentUser.isPinned.video ? 
                    <div className="pin-icon" onClick={ () => pinVideo(false, String(meetStateRef.current?.currentUser.userKey), localStream, true, false)}>
                        <FlashOffIcon/> 
                    </div>
                    :
                    <div className="pin-icon" onClick={ () => localStream && pinVideo(true, String(meetStateRef.current?.currentUser.userKey), localStream, true, false)}>
                        <FlashOnIcon/>
                    </div>
                }
            </div>}
            <div className="audio-icon"> 
                {audio ? <MicIcon className="mic-icon"/> : <MicOffIcon className="mic-icon"/>}
            </div>
          
        </div>
    )
}

export default LocalTile;