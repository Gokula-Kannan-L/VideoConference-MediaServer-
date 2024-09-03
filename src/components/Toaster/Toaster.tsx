import React from "react";
import { Snackbar } from "@mui/material";
import { useGlobalState } from "../../GlobalContext/GlobalContext";

const Toaster = () => {
    const {toaster, toasterMsg} = useGlobalState();
    return(
        <Snackbar 
            open={toaster}
            anchorOrigin={{ vertical: "top", horizontal:"right" }}
            autoHideDuration={3000}
            message={toasterMsg}
        />
    )
}

export default Toaster;