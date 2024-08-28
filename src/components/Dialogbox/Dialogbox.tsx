import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import { useGlobalState } from '../../GlobalContext/GlobalContext';

const Dialogbox = () => {
    const {dialogOpen, setDialogOpen, handleScreenShare, presenter} = useGlobalState();
    return(
        <Dialog open={dialogOpen} className='dialog-box' sx={{}}>
            <DialogContent className='dialog-content-main' sx={{width: '20rem'}}>
                <DialogContentText sx={{fontSize: '18px'}}>
                    This will let you take over from 
                </DialogContentText>
                <DialogContentText sx={{fontSize: '18px'}}>
                    {presenter?.userName} as the main presenter
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{margin:"5px"}}>
                <Button sx={{color:'#4CBB17', borderColor: '#4CBB17'}} onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
                <Button sx={{backgroundColor: "#4CBB17"}} onClick={() => handleScreenShare()} variant="contained">Share now</Button>
            </DialogActions>
        </Dialog>
    )
}

export default Dialogbox;