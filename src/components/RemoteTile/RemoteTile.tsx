import React, { FunctionComponent, useEffect, useRef, memo } from "react";
import "./RemoteTile.scss";

type RemoteProps = {
    userName: string
    videoStream: MediaStream
    audioStream: MediaStream
}
const RemoteTile:FunctionComponent<RemoteProps> = ({videoStream, audioStream, userName}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect( () => {
        if(videoRef.current && videoStream)
            videoRef.current.srcObject = videoStream;

        if(audioRef.current && audioStream)
            audioRef.current.srcObject = audioStream
        
    }, [videoStream, audioStream])
    return(
        <div className="remote-user">
             <video ref={videoRef} className="remote-video" muted autoPlay playsInline></video>
             <audio ref={audioRef} className="remote-video"  autoPlay playsInline></audio>
             <h5 className="user-name">{userName}</h5>
        </div>
       
    )
}

export default memo(RemoteTile);