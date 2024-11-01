import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';


const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const navigate = useNavigate();
    const currentUserId = useSelector((state) => state.auth.userId);
    const handleSearchSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(`http://localhost:3002/api/users/search?query=${searchQuery}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const users = response.data || [];

            // Nawet jeśli nie ma wyników, przekieruj do komponentu search-results
            navigate('/search-results', { state: { users, errorMessage: users.length === 0 ? 'No users found' : '' } });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setErrorMessage('No users found');
                navigate('/search-results', { state: { users: [], errorMessage: 'No users found' } });
            } else {
                setErrorMessage('An error occurred while searching for users');
                navigate('/search-results', { state: { users: [], errorMessage: 'An error occurred while searching for users' } });
            }
        }
    };

    return (
        <nav className="bg-gray-800 p-4 flex justify-between items-center">
            <div className="text-white text-2xl">
                <Link to="/">MERN SITE</Link>
            </div>
            <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                    <div className="flex p-2">
                        <Link to={"/"} className="text-white m-2 text-end">Home</Link>
                        <Link to={"notifications"} className="text-white m-2 text-end"> Notifications </Link>
                        <Link to="/chats" className="text-white m-2 text-end">Chat</Link>
                        <Link to="/profile" className="text-white m-2 text-end">Profile</Link>
                        <form onSubmit={handleSearchSubmit} className="m-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Wyszukaj użytkownika"
                                className="px-2 py-1 rounded"
                            />
                        </form>
                    </div>
                ) : (
                    <Link to="/login" className="text-white">Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
