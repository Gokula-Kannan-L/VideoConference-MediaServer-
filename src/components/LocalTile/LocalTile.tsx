import React, { FunctionComponent, RefObject } from "react";
import "./LocalTile.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";

type LocalTileProps = {
    videoRef: RefObject<HTMLVideoElement>
}

const LocalTile: FunctionComponent<LocalTileProps> = ({videoRef}) => {
    const {meetStateRef} = useGlobalState();

    return(
        <div className="local-tile">
           <video ref={videoRef} className="local-video" muted autoPlay playsInline></video>
           <h5 className="user-name">You ({meetStateRef.current?.currentUser.userName})</h5>
        </div>
    )
}

export default LocalTile;