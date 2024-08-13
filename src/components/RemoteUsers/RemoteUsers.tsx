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
                    
                    if(user.remoteStream?.video && user.remoteStream.audio && key != meetStateRef.current?.currentUser.userKey)
                        return <RemoteTile 
                                    videoStream={user.remoteStream.video} 
                                    audioStream={user.remoteStream.audio} 
                                    key={key} 
                                    userName={user.userName}
                                    audio={user.preference.audio}
                                    video={user.preference.video}
                                    avatar={user.avatar}
                                />
               })
            }
        </div>
    )
}

export default RemoteUsers;