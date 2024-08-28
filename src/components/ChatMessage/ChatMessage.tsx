import React, { FunctionComponent, useEffect, useState } from "react";
import "./ChatMessage.scss";
import SendIcon from '@mui/icons-material/Send';
import { useGlobalState } from "../../GlobalContext/GlobalContext";


const MessageCard:FunctionComponent<{message: string, name: string}> = ({message, name}) => {
    return(
        <div className="message-card">
            <h4>{name} : </h4>
            <p style={{padding: "10px", margin: 0}}>{message}</p>
        </div>
        
    )
}

const ChatMessage: FunctionComponent = () => {
    const {sendMessage, chatMessages, meetStateRef} = useGlobalState();
    const [message, setMessage] = useState<string>('');

    const handlMessage = () =>{
        if(message.length > 0){
            sendMessage(message)
            setMessage('');
        }
    }

    

    return(
        <div className="chat-wrappper">
            <div className="chat-messages">
                <h3 className="chat-title">Messages</h3>
                {
                    chatMessages && Object.keys(chatMessages).map( (key, index) => {
                        const message = chatMessages[key];

                        return <MessageCard message={message.message} name={meetStateRef.current?.currentUser.userName == message.userName ? "You" :  message.userName} key={index}/>
                    })
                }
            </div>
            <div className="send-message">
                <input className="message-input" placeholder="Type here..." value={message} onChange={ (event) => setMessage(event.target.value)}/>
                <div className="send-btn" onClick={handlMessage} >
                    <SendIcon />
                </div>
            </div>
        </div>
    )
}

export default ChatMessage;