import React, { FunctionComponent, useEffect } from "react";
import './RemoteUsers.scss';
import RemoteTile from "../RemoteTile/RemoteTile";
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const RemoteUsers:FunctionComponent = () => {
    const {participants, meetStateRef} = useGlobalState();
    
    return(
        <div className="remoteusers-container">
            {
               participants && Object.keys(participants).map( (key) => {
                    const user = participants[key];
                    let videoStream = user.remoteStream.video;

                    if(user.preference.screen && user.screenShare.displayStream){
                        videoStream = user.screenShare.displayStream;
                    }
                    if(videoStream && user.remoteStream.audio && key != meetStateRef.current?.currentUser.userKey)
                        return <RemoteTile 
                                    videoStream={videoStream} 
                                    audioStream={user.remoteStream.audio} 
                                    key={key}
                                    userKey = {user.userKey}
                                    userName={user.userName}
                                    audio={user.preference.audio}
                                    video={user.preference.video}
                                    avatar={user.avatar}
                                    isPinned={user.isPinned}
                                />
               })
            }
        </div>
    )
}

export default RemoteUsers;