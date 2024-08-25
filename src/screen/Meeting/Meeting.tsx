import React, { useEffect, useRef, useState } from "react";
import "./Meeting.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";
import LocalTile from "../../components/LocalTile/LocalTile";
import RemoteUsers from "../../components/RemoteUsers/RemoteUsers";
import { useNavigate, useSearchParams } from "react-router-dom";
import MeetControls from "../../components/MeetControls/MeetControls";
import ChatMessage from "../../components/ChatMessage/ChatMessage";
import { Grid } from "@mui/material";
import ScreenTile from "../../components/ScreenTile/ScreenTile";
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
enum meetOptions {
    chat = "CHAT",
    users = "USERS"
}
const Meeting = () => {

    const {meetStateRef, participants, mainTileInfo} = useGlobalState();
    const [meetOption, setMeetOption] = useState<meetOptions>(meetOptions.chat); 
    const navigate = useNavigate();

    useEffect( () => {
        if(!meetStateRef.current){
            navigate("/");
        }
    },[]);

    useEffect( () => {
        if(participants && (Object.keys(participants).length > 1)){
            setMeetOption(meetOptions.users);
        }else{
            setMeetOption(meetOptions.chat);
        }
    }, [participants])
console.log(mainTileInfo)
    return(
        <Grid container className="meet-container">
        <Grid item xs={12} className="meet-main">
            <Grid container item xs={12} direction={"row"}>
                <Grid item xs={9} className="video-container">
                    {mainTileInfo&& <ScreenTile/>}
                    <LocalTile />
                </Grid>
                <Grid item xs={3} className="chat-container">
                    {meetOptions.users == meetOption ?
                    <RemoteUsers />
                    :
                    <ChatMessage />}
                    <div className="meet-options">
                        <div className="user-groups" onClick={() => setMeetOption(meetOptions.users)}><PeopleIcon className="group-icon"/></div>
                        <div className="chat-box" onClick={() => setMeetOption(meetOptions.chat)}><ChatIcon className="chat-icon"/></div>
                    </div>
                    {/* <ChatIcon/> */}
                </Grid>
            </Grid>
        </Grid>
        <Grid item xs={12} className="meet-controls">
            <MeetControls />
        </Grid>
    </Grid>
    )
}

export default Meeting;