import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './screen/Home/Home';
import MeetingForm from './screen/MeetingForm/MeetingForm';
import Meeting from './screen/Meeting/Meeting';
import { FormType } from './GlobalContext/GlobalContext';

function App() {

  return (
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/create" element={<MeetingForm formType={FormType.CREATE}/>}/>
      <Route path="/join" element={<MeetingForm formType={FormType.JOIN}/>}/>
      <Route path="/meeting" element={<Meeting/>} />
    </Routes>
  );
}

export default App;
