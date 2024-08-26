import React, { FunctionComponent, useEffect } from "react";
import './RemoteUsers.scss';
import RemoteTile from "../RemoteTile/RemoteTile";
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const RemoteUsers:FunctionComponent = () => {
    const {participants, meetStateRef, displayStream, isScreenSharing} = useGlobalState();
    
    return(
        <div className="remoteusers-container">
            {
               participants && Object.keys(participants).map( (key) => {
                    const user = participants[key];
                    let videoStream = user.remoteStream.video;
                    if(videoStream && user.remoteStream.audio && user.userId != meetStateRef.current?.currentUser.userId)
                        return <RemoteTile 
                                    videoStream={videoStream} 
                                    audioStream={user.remoteStream.audio} 
                                    key={key}
                                    userKey = {user.userKey}
                                    userName={user.userName}
                                    audio={user.preference.audio}
                                    video={user.preference.video}
                                    avatar={user.avatar}
                                    isPinned={user.isPinned.video}
                                    screenShare={false}
                                    self={true}
                                />
               })
            }
            {
               participants && Object.keys(participants).map( (key) => {
                    const user = participants[key];
                    if(user.preference.screen && user.screenShare.displayStream){
                        return <RemoteTile 
                                    videoStream={user.screenShare.displayStream} 
                                    key={key}
                                    userKey = {user.userKey}
                                    userName={user.userName}
                                    audio={user.preference.audio}
                                    video={user.preference.video}
                                    avatar={user.avatar}
                                    isPinned={user.isPinned.screen}
                                    screenShare={true}
                                    self={true}
                                />
                    }
               })
            }
            {
                displayStream && isScreenSharing && meetStateRef.current && 
                <RemoteTile 
                    videoStream={displayStream} 
                    key={meetStateRef.current.currentUser.userKey}
                    userKey = {meetStateRef.current.currentUser.userKey}
                    userName={meetStateRef.current.currentUser.userName}
                    audio={false}
                    video={true}
                    avatar={""}
                    isPinned={meetStateRef.current?.currentUser.isPinned.screen}
                    screenShare={true}
                    self={true}
                />
            }
        </div>
    )
}

export default RemoteUsers;