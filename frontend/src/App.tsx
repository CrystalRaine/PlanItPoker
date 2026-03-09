import './App.css'
import { BrowserRouter, Route, Link, Routes } from "react-router-dom";
import Home from './Pages/Home/Home';
import Create from './Pages/Create/Create';
import Join from './Pages/Join/Join';
import Room from './Pages/Room/Room';
import { getLocalStorage, setLocalStorage } from './utilities/utility';
import { useEffect, useState } from 'react';

export default function App() {
    return (
        <BrowserRouter>
            <div id='siteHeader'>
                <h1><Link to='/'>Vote!</Link></h1>
                <LightDarkSwitch/>
            </div>
            <div id='siteBackground'>
                <Routes>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/home" element={<Home/>}/>

                    <Route path="/create" element={<Create/>}/>
                    <Route path="/create/:roomID" element={<Create/>}/>
                    <Route path="/create/:roomID/:userID" element={<Create/>}/>

                    <Route path="/join" element={<Join/>}/>
                    <Route path="/join/:roomID" element={<Join/>}/>
                    <Route path="/join/:roomID/:userID" element={<Join/>}/>

                    <Route path="/room/:roomID/:userID" element={<Room/>}/>
                    <Route path="/host/:roomID/:userID" element={<Room host={true}/>}/>
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export function LightDarkSwitch() {

    let darkModeLocalStorage = getLocalStorage("darkMode");

    const [darkMode, setDarkMode] = useState(darkModeLocalStorage == "true");

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
    }, [darkMode]);

    return (
        <label className="switch">
        <input
            type="checkbox"
            checked={darkMode}
            onChange={() => {setLocalStorage("darkMode", !darkMode ? "true" : "false"); setDarkMode((prev) => !prev);}}
            aria-label="Toggle dark mode"
        />
        <span className="slider" />
        </label>
    );
}