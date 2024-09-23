import { FunctionComponent, useEffect, useRef, useState } from "react";
import './MeetingForm.scss';
import { Button, Grid, TextField, Typography } from "@mui/material";
import { getRandomColor, getUserMedia } from "../../helper/helper";
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
    const [userId, setUserId] = useState<string>('');

    const [joinMeetId, setJoinMeetId] = useState<string>('');
    const [startBtn, setStartBtn] = useState<boolean>(true);

    const [previewStream, setPreviewStrem] = useState<MediaStream>();
    
    useEffect( () => {
        const getPreviewStream = async() => {
            const stream = await getUserMedia({video: true});
            setPreviewStrem(stream);
            previewRef.current.srcObject = stream;
            setStartBtn(false);
        }
        getPreviewStream();
    }, []);

    const handleStartMeeting = async() => {
        const url = process.env.REACT_APP_BASE_URL;
        if(url && userName.length > 3){
            await fetch(`${url}/createMeeting`, {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    userName,
                    avatarKey: "avatarKey",
                    env: 'DEV'
                })
            }).then( async(response) => {
                const data = await response.json();
                if(data.meetInfo){
                    const {meetId, user, host, createdAt} = data.meetInfo;
                    await InitialiseMeeting({
                        meetId,
                        avatar: getRandomColor(),
                        currentUser: {
                            userId: user.userId,
                            userKey: user.userKey,
                            userName: user.userName,
                            avatarKey: user.avatarKey,
                            preference: {
                                audio: true,
                                video: true,
                                screen: false
                            },
                            isPinned: {video: false, screen: false}
                        },
                        host:{
                            hostId: host.hostId,
                            hostKey: host.hostKey,
                            hostName: host.hostName
                        },
                        createdAt
                    }, FormType.CREATE);
                    if(previewStream && previewRef.current){
                        previewStream.getVideoTracks()[0].stop();
                        previewStream.getVideoTracks()[0].enabled = false;
                        previewRef.current = null;
                        navigate(`/meeting?meetId=${meetId}`);
                    }
                    
                }
            }).catch( (error) => {
                console.log("Creating Meeting Error :", error);
            });

        }
    }

    const handleJoinMeeting = async() => {
        const url = process.env.REACT_APP_BASE_URL;
        if(url && userName.length > 3 && joinMeetId){
            await fetch(`${url}/joinMeeting`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    userName,
                    avatarKey: "avatarKey",
                    meetId: joinMeetId
                })
            }).then(async(response) => {
                const data = await response.json();
                if(data.meetInfo){
                    const {meetId, user, host, createdAt} = data.meetInfo;
                    await InitialiseMeeting({
                        meetId,
                        avatar: getRandomColor(),
                        currentUser: {
                            userId: user.userId,
                            userKey: user.userKey,
                            userName: user.userName,
                            avatarKey: user.avatarKey,
                            preference: {
                                audio: true,
                                video: true,
                                screen: false
                            },
                            isPinned: {video: false, screen: false}
                        },
                        host:{
                            hostId: host.hostId,
                            hostKey: host.hostKey,
                            hostName: host.hostName
                        },
                        createdAt
                    }, FormType.JOIN);

                    if(previewStream && previewRef.current){
                        previewStream.getVideoTracks()[0].stop();
                        previewStream.getVideoTracks()[0].enabled = false;
                        previewRef.current = null;
                        navigate(`/meeting?meetId=${meetId}`);
                    }
                }
            })
        }
    }
    
    return(
        <Grid container className="grid-container">
            <Grid item xs={4} className="grid-1">
                <div className="grid-wrapper">
                    <Typography variant="body1" className="input-label">Enter your email Id</Typography>
                    <TextField placeholder="Email Id" className="input-field" value={userId} onChange={ (event) => setUserId(event.target.value)}/>
                </div>
                <div className="grid-wrapper">
                    <Typography variant="body1" className="input-label">Enter your name</Typography>
                    <TextField placeholder="Username" className="input-field" value={userName} onChange={ (event) => setUserName(event.target.value)}/>
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