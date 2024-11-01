import React from 'react';
import { useDispatch } from 'react-redux'; // Import useDispatch
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Info from './ProfileComponents/Info';
import Posts from './ProfileComponents/Posts';
import Friends from './ProfileComponents/Friends';
import Images from './ProfileComponents/Images';
import { logout } from '../redux/auth'; // Import akcji logout

const Profile = () => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [view, setView] = useState('Info');
    const fullName = `${user.firstName} ${user.lastName}`;
    const navigate = useNavigate();
    const dispatch = useDispatch(); // Hook do wysyłania akcji

    const handleLogout = () => {
        localStorage.removeItem('token'); // Usuń token z localStorage
        dispatch(logout()); // Wyślij akcję logout do Redux
        navigate('/login'); // Przekieruj użytkownika do strony logowania
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    console.log('skibidi toilets')
    const renderView = () => {
        switch (view) {
            case 'Info':
                return <Info />;
            case 'Posts':
                return <Posts />;
            case 'Images':
                return <Images />;
            case 'Friends':
                return <Friends />;
            default:
                return <Info />;
        }
    };

    return (
        <div className="flex justify-start flex-col items-center min-h-screen bg-gray-100 mt-0">
            <div className="p-8 rounded shadow-lg max-w-6xl w-full bg-gray-100">
                <div className="mb-4 flex justify-between items-center">
                    <div className="block font-bold mb-1 text-2xl">{fullName}</div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-md"
                    >
                        Logout
                    </button>
                </div>
                <div className="flex flex-row justify-start h-10 w-full">
                    <button
                        onClick={() => setView('Info')}
                        className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                    >
                        Info
                    </button>
                    <button
                        onClick={() => setView('Posts')}
                        className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setView('Images')}
                        className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                    >
                        Images
                    </button>
                    <button
                        onClick={() => setView('Friends')}
                        className="px-4 py-1 rounded-md font-bold text-slate-400 hover:bg-gray-200"
                    >
                        Friends
                    </button>
                </div>
                {renderView()}
            </div>
        </div>
    );
};

export default Profile;
