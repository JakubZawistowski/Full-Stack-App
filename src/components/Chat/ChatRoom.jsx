import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Chat from './Chat'; // Zakładam, że komponent Chat jest w tym samym folderze

const ChatRoom = ({ selectedUserId }) => {
    const [userExists, setUserExists] = useState(true); // Sprawdzamy, czy użytkownik istnieje

    useEffect(() => {
        const checkUserExists = async () => {
            try {
                // Zakładając, że masz endpoint do sprawdzania użytkownika
                const response = await axios.get(`http://localhost:3002/api/users/${selectedUserId}`);
                if (!response.data) {
                    setUserExists(false);
                }
            } catch (error) {
                setUserExists(false);
                console.error('Error checking user:', error);
            }
        };

        if (selectedUserId) {
            checkUserExists();
        }
    }, [selectedUserId]);

    if (!userExists) {
        return <div>User not found</div>;
    }

    return (
        <div>
            <Chat selectedUserId={selectedUserId} />
        </div>
    );
};

export default ChatRoom;
