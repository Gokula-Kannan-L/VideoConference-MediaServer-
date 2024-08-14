import React, { useEffect, useRef, useState } from "react";
import "./Meeting.scss";
import { ParticipantType, useGlobalState } from "../../GlobalContext/GlobalContext";
import LocalTile from "../../components/LocalTile/LocalTile";
import RemoteUsers from "../../components/RemoteUsers/RemoteUsers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Device } from "mediasoup-client";
import MeetControls from "../../components/MeetControls/MeetControls";
import ChatMessage from "../../components/ChatMessage/ChatMessage";
import { Grid } from "@mui/material";


const Meeting = () => {
    const [searchParams] = useSearchParams();
    const {meetStateRef} = useGlobalState();
    const meetId = searchParams.get('meetId');
    const navigate = useNavigate();

    useEffect( () => {
        if(!meetStateRef.current){
            navigate("/");
        }
    },[])

  

    return(

            <Grid spacing={2} className="meet-container">
                <Grid xs={12} className="meet-main" direction={"row"}>
                    <Grid xs={8} className="video-container">
                        <RemoteUsers/>
                        <LocalTile/>
                    </Grid>
                    <Grid xs={4} className="chat-container">
                        <ChatMessage/>
                    </Grid>
                </Grid>
                <Grid xs={12} className="meet-controls">
                    <MeetControls/>
                </Grid>

            </Grid>
    )
}

export default Meeting;