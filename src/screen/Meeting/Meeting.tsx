import React, { useEffect, useRef, useState } from "react";
import "./Meeting.scss";
import { ParticipantType, useGlobalState } from "../../GlobalContext/GlobalContext";
import LocalTile from "../../components/LocalTile/LocalTile";
import RemoteUsers from "../../components/RemoteUsers/RemoteUsers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Device } from "mediasoup-client";
import MeetControls from "../../components/MeetControls/MeetControls";


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
        <div className="meet-container">
            <div className="meet-main">
                <RemoteUsers/>
                <LocalTile/>
            </div>
            <div className="meet-controls">
                <MeetControls/>
            </div>
        </div>
    )
}

export default Meeting;