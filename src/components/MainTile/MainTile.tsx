import React, { FunctionComponent, useEffect, useRef } from "react";
import "./MainTile.scss";
import { MainTileType, useGlobalState } from "../../GlobalContext/GlobalContext";

type MainTileProps = {
    presenter: MainTileType | null
}

const MainTile:FunctionComponent<MainTileProps> = ({presenter}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const {meetStateRef, participants} = useGlobalState();

    useEffect(() => {
        if(presenter && videoRef.current){
            videoRef.current.srcObject = presenter.videoStream;
            if(meetStateRef.current && presenter.userId == meetStateRef.current.currentUser.userId){
                if(presenter.pinType.screen){
                    meetStateRef.current.currentUser.isPinned.screen = true;
                }else{
                    meetStateRef.current.currentUser.isPinned.video = true;
                }
            }else{
                participants && Object.keys(participants).forEach((key) => {
                    let user = participants[key];
                    if(user.userId == presenter.userId){
                        if(presenter.pinType.screen){
                           user.isPinned.screen = true;
                        }else{
                           user.isPinned.video = true;
                        }
                    }
                });
            }
        }
    }, [presenter]);

    return(
        <div className="maintile-container">
            <video ref={videoRef} className="maintile-video" style={{width: "100%", objectFit: "cover"}} autoPlay playsInline muted></video>
            <h5 className="user-name">{presenter?.title}</h5>
        </div>
    )
}

export default MainTile;