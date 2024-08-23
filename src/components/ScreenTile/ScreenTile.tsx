import React, { useEffect, useRef } from "react";
import "./ScreenTile.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const ScreenTile = () => {
    const {displayStream, screenShare} = useGlobalState();
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect( () => {
        if(displayStream && videoRef.current)
            videoRef.current.srcObject = displayStream
    }, [displayStream, screenShare]);
    
    return(
        <div className="screenshare-main">
             <video ref={videoRef} className="screen-video" muted autoPlay playsInline></video>
             <h4 className="screen-title">You're presenting the screen</h4>
        </div>
    )
}

export default ScreenTile;