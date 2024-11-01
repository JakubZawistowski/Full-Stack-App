import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import axios from "axios";

export default function Info({ user }) {
    const [profilePicture, setProfilePicture] = useState(null);
    const [newProfilePicture, setNewProfilePicture] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false); // Stan do zarządzania pełnym widokiem

    const { user: currentUser } = useSelector((state) => state.auth);

    useEffect(() => {
        // Ustawianie zdjęcia profilowego tylko wtedy, gdy jest dostępne
        if (user && user.profilePicture) {
            setProfilePicture(user.profilePicture);
        } else {
            setProfilePicture(null); // Upewnij się, że stan jest resetowany, gdy nie ma zdjęcia
        }
    }, [user]);

    const handleProfilePictureChange = (e) => {
        setNewProfilePicture(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('profilePicture', newProfilePicture);

            const response = await axios.put('http://localhost:3002/api/users/profile-picture', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setProfilePicture(response.data.profilePicture); // Aktualizacja stanu po zapisaniu nowego zdjęcia
        } catch (error) {
            console.error('Error updating profile picture:', error);
        }
    };

    const openFullScreen = () => {
        setIsFullScreen(true); // Otwiera pełny widok
    };

    const closeFullScreen = () => {
        setIsFullScreen(false); // Zamyka pełny widok
    };

    return (
        <div>
            {profilePicture ? (
                <img
                    src={`http://localhost:3002/uploads/profile-pictures/${profilePicture}?t=${Date.now()}`}
                    alt="Profile"
                    className="w-48 h-48 object-cover rounded-full cursor-pointer"
                    onClick={openFullScreen} // Otwieranie pełnego widoku po kliknięciu
                />
            ) : (
                <p>No profile picture</p>
            )}
            {currentUser && currentUser._id === user.id && (
                <form onSubmit={handleSubmit}>
                    <input
                        type="file"
                        onChange={handleProfilePictureChange}
                        accept="image/*"
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 mt-2 hover:bg-blue-700">
                        Update Profile Picture
                    </button>
                </form>
            )}
            <div className="mb-4 mt-4">
                <div className="flex">
                    <label className="block font-bold mb-1 mr-1">Email:</label>
                    <div>{user.email}</div>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex">
                    <label className="block font-bold mb-1 mr-1">Location:</label>
                    <div>{user.location}</div>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex">
                    <label className="block font-bold mb-1 mr-1">Friends:</label>
                    <div>{user.friends.length}</div>
                </div>
            </div>

            {/* Pełny widok zdjęcia profilowego */}
            {isFullScreen && (
                <div
                    className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-75 z-50"
                    onClick={closeFullScreen}
                >
                    <img
                        src={`http://localhost:3002/uploads/profile-pictures/${profilePicture}?t=${Date.now()}`}
                        alt="Fullscreen Profile"
                        className="max-w-full max-h-full"
                    />
                    <button
                        className="absolute top-4 right-4 bg-white text-black p-2 rounded-full"
                        onClick={closeFullScreen}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
