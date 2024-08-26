import React, { useEffect, useRef, useState } from "react";
import "./ScreenTile.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";
import { Avatar } from "@mui/material";

const ScreenTile = () => {
    const {mainTileInfo} = useGlobalState();
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect( () => {
       if(mainTileInfo && videoRef.current){
            videoRef.current.srcObject = mainTileInfo.stream
       }
    }, [mainTileInfo]);

    return(
        <div className="screenshare-main">
            {
                mainTileInfo?.pinnedUser &&
                <>
                    {(mainTileInfo.pinnedUser?.preference.video ) ?
                    <>
                        <video ref={videoRef} className="screen-video user-video" muted autoPlay playsInline></video>
                        <h4 className="screen-title">{mainTileInfo?.message}</h4>
                    </>
                   :
                   <div className="screen-video">
                       <Avatar className="avatar-icon" sx={{backgroundColor: mainTileInfo?.pinnedUser?.avatar}}>{mainTileInfo?.pinnedUser?.userName.charAt(0).toUpperCase() }</Avatar>
                   </div>}
                </>
            }
                
            {!mainTileInfo?.pinnedUser && mainTileInfo?.stream &&
                <>
                    <video ref={videoRef} className="screen-video" muted autoPlay playsInline></video>
                    <h4 className="screen-title">{mainTileInfo?.message}</h4>
                </>
            }
        </div>
    )
}

export default ScreenTile;