import React, { useEffect, useRef, useState } from "react";
import "./Meeting.scss";
import { useGlobalState } from "../../GlobalContext/GlobalContext";
import { useNavigate } from "react-router-dom";
import MeetControls from "../../components/MeetControls/MeetControls";
import ChatMessage from "../../components/ChatMessage/ChatMessage";
import { Grid } from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import VideoLayout from "../../Layouts/VideoLayout/VideoLayout";
import RemoteLayout from "../../Layouts/RemoteLayout/RemoteLayout";
import Dialogbox from "../../components/Dialogbox/Dialogbox";
enum meetOptions {
    chat = "CHAT",
    users = "USERS"
}
const Meeting = () => {

    const {meetStateRef, participants, isScreenSharing} = useGlobalState();
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

    useEffect( () => {
        if(isScreenSharing){
            setMeetOption(meetOptions.users);
        }
    }, [isScreenSharing]);

    return(
        <Grid container className="meet-container">
            <Grid item xs={12} className="meet-main">
                <Grid container item xs={12} direction={"row"}>
                    <Grid item xs={9} className="video-container">
                        <VideoLayout />
                        <Dialogbox/>
                    </Grid>
                    <Grid item xs={3} className="chat-container">
                        {meetOptions.users == meetOption ?
                            <RemoteLayout />
                            :
                            <ChatMessage />
                        }
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