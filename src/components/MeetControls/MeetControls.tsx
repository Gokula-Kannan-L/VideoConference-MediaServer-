import React, { useEffect, useState } from "react";
import "./MeetControls.scss";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const MeetControls = () => {
    const {audio, video, toggleAudio, toggleVideo, leaveMeeting} = useGlobalState();

 
    return(
        <div className="controls">
            <div className="video" onClick={() => toggleVideo(!video)}>
                {video ? 
                    <VideocamIcon className="video-cam"/> :
                    <VideocamOffIcon className="video-cam"/>
                }
            </div>
            <div className="audio"  onClick={() => toggleAudio(!audio)}>
                {audio ?
                    <MicIcon className="audio-mic"/> :
                    <MicOffIcon className="audio-mic"/>
                }
            </div>
            <div className="end-call" onClick={() => leaveMeeting()}>
                <CallEndIcon className="call-icon"/>
            </div>
        </div>
    )
}

export default MeetControls;