import React, { FunctionComponent, useEffect, useRef, memo } from "react";
import "./RemoteTile.scss";

type RemoteProps = {
    userName: string
    mediastream: MediaStream
}
const RemoteTile:FunctionComponent<RemoteProps> = ({mediastream, userName}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect( () => {
        if(videoRef.current && mediastream)
            videoRef.current.srcObject = mediastream;
    }, [mediastream])
    return(
        <div className="remote-user">
             <video ref={videoRef} className="remote-video" muted autoPlay playsInline></video>
             <h5 className="user-name">{userName}</h5>
        </div>
       
    )
}

export default memo(RemoteTile);