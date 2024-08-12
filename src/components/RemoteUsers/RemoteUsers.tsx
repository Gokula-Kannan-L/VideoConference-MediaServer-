import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import './RemoteUsers.scss';

import RemoteTile from "../RemoteTile/RemoteTile";
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const RemoteUsers:FunctionComponent = () => {
    const {participants} = useGlobalState();

    return(
        <div className="remoteusers-container">
            {
               participants && Object.keys(participants).map( (key) => {
                    console.log("Particpants : ", participants);
                    const user = participants[key];
                    
                    if(user.remoteStream?.video && user.remoteStream.audio)
                        return <RemoteTile videoStream={user.remoteStream.video} audioStream={user.remoteStream.audio} key={key} userName={user.userName}/>
                    else
                        console.log("New Remote User :", user);
               })
            }
        </div>
    )
}

export default RemoteUsers;