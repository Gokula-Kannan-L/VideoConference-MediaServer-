import React from "react";
import { Snackbar } from "@mui/material";
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const Toaster = () => {
    const {toaster, toasterMsg} = useGlobalState();
    return(
        <Snackbar 
            open={toaster}
            autoHideDuration={3000}
            message={toasterMsg}
        />
    )
}

export default Toaster;