import React, { FunctionComponent, ReactNode, useEffect, useRef, useState } from "react";
import VideoTile, { TileType } from "../../components/VideoTile/VideoTile";
import { MainTileType, useGlobalState } from "../../GlobalContext/GlobalContext";
import "./VideoLayout.scss";
import MainTile from "../../components/MainTile/MainTile";

const VideoLayout:FunctionComponent = () => {
    const {meetStateRef, localStream, presenter} = useGlobalState();
    const [tileData, setTileData] = useState<MainTileType | null>(null);

    useEffect(() => {
        setTileData(presenter);
        console.log(presenter);
    }, [presenter]);

    return(
        <div className="video-layout">
            <div className="local-tile">
                {meetStateRef.current && localStream &&
                    <VideoTile
                        key={meetStateRef.current.currentUser.userKey}
                        tileType={TileType.local}
                        width={"370px"}
                        height={"200px"}
                        userName={meetStateRef.current.currentUser.userId == meetStateRef.current.host.hostId ? `${meetStateRef.current.currentUser.userName} (Host)` : meetStateRef.current.currentUser.userName}
                        userKey={meetStateRef.current.currentUser.userKey}
                        avatarColorCode={meetStateRef.current.avatar}
                        videoEnabled={meetStateRef.current.currentUser.preference.video}
                        audioEnabled={false}
                        screenShareEnabled={false}
                        videoStream={localStream}
                        audioStream={localStream}
                        isPinned={meetStateRef.current.currentUser.isPinned.video}
                    />
                }
            </div>
            <div className="main-tile">
               {tileData && <MainTile presenter={tileData}/>}
            </div>
            
        </div>
    )
}

export default VideoLayout