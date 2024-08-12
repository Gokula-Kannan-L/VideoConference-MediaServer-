import { FunctionComponent, useEffect, useRef, useState } from "react";
import './MeetingForm.scss';
import { Button, Grid, TextField, Typography } from "@mui/material";
import { getUserMedia } from "../../helper/helper";
import { useNavigate } from "react-router-dom";
import { FormType, useGlobalState } from "../../GlobalContext/GlobalContext";

type MeetingFormType = {
    formType: FormType
}
const MeetingForm:FunctionComponent<MeetingFormType> = ({formType}) => {

    const previewRef = useRef<any | null>(null);
    const navigate = useNavigate();
    const {InitialiseMeeting} = useGlobalState();

    const [userName, setUserName] = useState<string>('');
    const [joinMeetId, setJoinMeetId] = useState<string>('');
    const [startBtn, setStartBtn] = useState<boolean>(true);
    
    useEffect( () => {
        const getPreviewStream = async() => {
            const stream = await getUserMedia({video: true});
            previewRef.current.srcObject = stream;
            setStartBtn(false);
        }
        getPreviewStream();
    }, []);

    const handleStartMeeting = async() => {
        if(userName.length > 3){
            await fetch("http://localhost:8000/createMeeting", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({userName})
            }).then( async(response) => {
                const data = await response.json();
                console.log(data);
                if(data.meetInfo){
                    const {meetId, user, host, createdAt} = data.meetInfo;
                    await InitialiseMeeting({
                        meetId,
                        currentUser: {
                            userKey: user.userKey,
                            userName: user.userName,
                            preference: {
                                audio: true,
                                video: true,
                                screen: false
                            }
                        },
                        host:{
                            hostKey: host.hostKey,
                            hostName: host.hostName
                        },
                        createdAt
                    }, FormType.CREATE);
                    navigate(`/meeting?meetId=${meetId}`);
                }
            }).catch( (error) => {
                console.log("Creating Meeting Error :", error);
            });

        }
    }

    const handleJoinMeeting = async() => {
        if(userName.length > 3 && joinMeetId){
            await fetch("http://localhost:8000/joinMeeting", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({userName, meetId: joinMeetId})
            }).then( async(response) => {
                const data = await response.json();
                console.log(data);
                if(data.meetInfo){
                    const {meetId, user, host, createdAt} = data.meetInfo;
                    await InitialiseMeeting({
                        meetId,
                        currentUser: {
                            userKey: user.userKey,
                            userName: user.userName,
                            preference: {
                                audio: true,
                                video: true,
                                screen: false
                            }
                        },
                        host:{
                            hostKey: host.hostKey,
                            hostName: host.hostName
                        },
                        createdAt
                    }, FormType.JOIN);
                    navigate(`/meeting?meetId=${meetId}`);
                }
            })
        }
    }
    
    return(
        <Grid container className="grid-container">
            <Grid item xs={4} className="grid-1">
                <div className="grid-wrapper">
                    <Typography variant="body1" className="input-label">Enter your name</Typography>
                    <TextField placeholder="username" className="input-field" value={userName} onChange={ (event) => setUserName(event.target.value)}/>
                </div>
                {formType == FormType.JOIN && <div className="grid-wrapper">
                    <Typography variant="body1" className="input-label">Enter Meeting ID</Typography>
                    <TextField placeholder="meetingId" className="input-field" value={joinMeetId} onChange={ (event) => setJoinMeetId(event.target.value)}/>
                </div>}
                {formType == FormType.CREATE? 
                    <Button variant="contained" className="start-btn" disabled={startBtn} onClick={handleStartMeeting}>Start Meeting</Button> :
                    <Button variant="contained" className="start-btn" disabled={startBtn} onClick={handleJoinMeeting}>Join Meeting</Button>
                }
            </Grid>
            <Grid item xs={8} className="grid-2">
                <video ref={previewRef} muted playsInline autoPlay className="preview-video" ></video>
            </Grid>
        </Grid>
    );
}

export default MeetingForm;