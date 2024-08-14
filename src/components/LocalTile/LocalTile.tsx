import React, { FunctionComponent, RefObject, useEffect, useRef } from "react";
import "./LocalTile.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { Avatar } from "@mui/material";

const LocalTile: FunctionComponent = () => {
    const {meetStateRef, audio, video, localStream} = useGlobalState();
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect( () => {
        if(localStream && videoRef.current)
            videoRef.current.srcObject = localStream
    }, [localStream, video])
    return(
        <div className="local-tile">
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
            <div className="audio-icon"> 
                {audio ? <MicIcon className="mic-icon"/> : <MicOffIcon className="mic-icon"/>}
            </div>
          
        </div>
    )
}

export default LocalTile;