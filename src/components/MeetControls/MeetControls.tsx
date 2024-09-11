import React, { useEffect, useState } from "react";
import "./MeetControls.scss";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import SettingsIcon from '@mui/icons-material/Settings';
import { useGlobalState } from "../../GlobalContext/GlobalContext";
import { Dialog, List, ListItemButton } from "@mui/material";

const MeetControls = () => {
    const {audio, video, isScreenSharing, toggleAudio, toggleVideo, handleScreenShare, stopScreenShare, leaveMeeting, isHost, muteAllUsers, endMeeting} = useGlobalState();
    const [toggleSettings, setToggleSettings] = useState<boolean>(false);
    const Settings = () => {
        return(
            <List className="settings-main">
                <ListItemButton className="settings-items" onClick={ () => {muteAllUsers(); setToggleSettings(false)}}><MicOffIcon/>Mute All</ListItemButton>
                <ListItemButton className="settings-items" onClick={ () => {endMeeting(); setToggleSettings(false)}}><MicOffIcon/>End Meeting</ListItemButton>
            </List>
        )
    }

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
            {isScreenSharing ?
                <div className="stop-share" onClick={() => stopScreenShare()}>
                    <CancelPresentationIcon className="stop-screen" />
                </div>
                :
                <div className="screen" onClick={handleScreenShare}>
                    <PresentToAllIcon className="share-screen" />
                </div>
            }
           {isHost && 
            <div className="settings" onClick={ () => setToggleSettings(!toggleSettings)}>
                {toggleSettings && <Settings/>}
                <SettingsIcon className="settings-icon"/>
            </div>}
            <div className="end-call" onClick={() => leaveMeeting()}>
                <CallEndIcon className="call-icon"/>
            </div>
        </div>
    )
}

export default MeetControls;