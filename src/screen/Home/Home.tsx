import React, { FunctionComponent } from "react";
import './Home.scss';
import { Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Home: FunctionComponent = () => {

    const navigate = useNavigate();

    return(
        <div className="home-container">
            <div className="home-wrapper">
                <div className="home-wrapper-child">
                    <Typography variant="h5">To start a new Meeting</Typography>
                    <Button variant="contained" className="meeting-btn" onClick={ () => navigate('/create')}>Create Meeting</Button>
                </div>
                <Typography variant="h5">(OR)</Typography>
                <div className="home-wrapper-child">
                    <Typography variant="h5">To join an existing Meeting</Typography>
                    <Button variant="contained" className="meeting-btn" onClick={ () => navigate('/join')}>Join Meeting</Button>
                </div>
            </div>
        </div>
    )
}

export default Home;