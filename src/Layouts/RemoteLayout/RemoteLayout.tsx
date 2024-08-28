import React, { FunctionComponent } from "react";
import "./RemoteLayout.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";
import VideoTile, { TileType } from "../../components/VideoTile/VideoTile";

const RemoteLayout:FunctionComponent = () => {
    const {participants, meetStateRef, isScreenSharing, displayStreamRef} = useGlobalState();

    return(
        <div className="remote-container">
            {
                isScreenSharing && meetStateRef.current && displayStreamRef.current &&
                <VideoTile
                        key={meetStateRef.current.currentUser.userKey}
                        tileType={TileType.local}
                        width="100%"
                        height="200px"
                        userName={meetStateRef.current.currentUser.userId == meetStateRef.current.host.hostId ? `${meetStateRef.current.currentUser.userName} (Host)` : meetStateRef.current.currentUser.userName}
                        userKey={meetStateRef.current.currentUser.userKey}
                        avatarColorCode={""}
                        videoEnabled={false}
                        audioEnabled={false}
                        screenShareEnabled={true}
                        videoStream={displayStreamRef.current}
                        audioStream={displayStreamRef.current}
                        isPinned={meetStateRef.current.currentUser.isPinned.screen}
                />
            }
            {
                participants && Object.keys(participants).map((key) => {
                    const user = participants[key];
                    if(user.remoteStream.video && user.remoteStream.audio && meetStateRef.current){
                        return <VideoTile
                            key={key}
                            tileType={TileType.remote}
                            width="100%"
                            height="200px"
                            userName={user.userId == meetStateRef.current.host.hostId ? `${user.userName} (Host)` : user.userName}
                            userKey={user.userKey}
                            avatarColorCode={user.avatar}
                            videoEnabled={user.preference.video}
                            audioEnabled={user.preference.audio}
                            screenShareEnabled={false}
                            videoStream={user.remoteStream.video}
                            audioStream={user.remoteStream.audio}
                            isPinned={user.isPinned.video}
                        />
                    }
                })
            }
            {
                participants && Object.keys(participants).map((key) => {
                    const user = participants[key];
                    if(user.preference.screen && user.screenShare.displayStream){
                        return <VideoTile
                            key={key}
                            tileType={TileType.screenShare}
                            width="100%"
                            height="200px"
                            userName={`${user.userName} (Sharing)`}
                            userKey={user.userKey}
                            avatarColorCode={user.avatar}
                            videoEnabled={false}
                            audioEnabled={false}
                            screenShareEnabled={true}
                            videoStream={user.screenShare.displayStream}
                            audioStream={user.screenShare.displayStream}
                            isPinned={user.isPinned.video}
                        />
                    }
                })
            }
        </div>
    )
}

export default RemoteLayout;