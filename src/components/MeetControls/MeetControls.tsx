import React from "react";
import "./MeetControls.scss";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const MeetControls = () => {
    const {meetStateRef, toggleAudio, toggleVideo} = useGlobalState();
 
    return(
        <div className="controls">
            <div className="video" onClick={ () => toggleVideo(!meetStateRef.current?.currentUser.preference.video)}>
                {meetStateRef.current?.currentUser.preference.video ? 
                    <VideocamIcon className="video-cam"/> :
                    <VideocamOffIcon className="video-cam"/>
                }
            </div>
            <div className="audio"  onClick={ () => toggleAudio(!meetStateRef.current?.currentUser.preference.video)}>
                {meetStateRef.current?.currentUser.preference.audio ?
                    <MicIcon className="audio-mic"/> :
                    <MicOffIcon className="audio-mic"/>
                }
            </div>
        </div>
    )
}

export default MeetControls;