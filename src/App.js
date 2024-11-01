import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from "./components/Register";
import SearchResults from "./components/SearchResults";
import UserProfile from "./components/ProfileComponents/UserProfile";
import ChatList from './components/Chat/ChatList';
import ChatRoom from './components/Chat/ChatRoom';
import Invitations from "./components/Notifications/Invitations";
import CreateGroupChat from "./components/Chat/CreateGroupChat";
import Home from "./components/Home";

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/search-results" element={<SearchResults />} />
                <Route path="/chats" element={<ChatList />}/>
                <Route path="/chats/:chatId" element={<ChatRoom />} />
                <Route path={"/notifications"} element={<Invitations/>}/>
                <Route path={"/create-group-chat"} element={<CreateGroupChat/>}/>
            </Routes>
        </Router>
    );
}

export default App;
