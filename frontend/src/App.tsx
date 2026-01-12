import './App.css'
import { BrowserRouter, Route, Link, Routes } from "react-router-dom";
import Default from './Default';
import Home from './Pages/Home/Home';
import Create from './Pages/Create/Create';
import Join from './Pages/Join/Join';
import Room from './Pages/Room/Room';

export default function App() {

    return (
        <BrowserRouter>
            <div id='siteHeader'>
                <h1><Link to='/'>Plan-It-Poker</Link></h1>
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
                    <Route path="/Default" element={<Default/>}/>
                </Routes>
            </div>
        </BrowserRouter>
    );
}