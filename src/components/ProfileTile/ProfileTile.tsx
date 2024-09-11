import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import "./ProfileTile.scss";
import { Avatar } from "@mui/material";

export type ProfileTileData = {
    userId: string, userName: string, avatarCode: string, preference: {audio: boolean, video: boolean}, mediaStream: MediaStream
}

type ProfleTileProps = {
    userData:  ProfileTileData
}

const ProfileTile:FunctionComponent<ProfleTileProps> = ({userData}) => {

    useEffect(()=> {
        if(videoRef.current)
            videoRef.current.srcObject = userData.mediaStream;
    }, [userData])
 
    const videoRef = useRef<HTMLVideoElement>(null);

    return(
        <div className="profiletile-container">
            {userData &&
                <>
                {userData.preference.video ?
                    <video ref={videoRef} playsInline autoPlay muted className="profiletile-video"></video>
                    :
                    <div className="maintile-avatar">
                    <   Avatar className="avatar-icon" sx={{backgroundColor: userData.avatarCode}}>{userData.userName.charAt(0).toUpperCase() }</Avatar>
                    </div>
                }
                <></>
                </>
            }
             <h5 className="user-name">{userData.userName}</h5>
        </div>
    )
}

export default ProfileTile;