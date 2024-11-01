import { createSlice } from "@reduxjs/toolkit";

const friendsSlice = createSlice({
    name: 'friends',
    initialState: {
        friends: [],
        invitationsSent: [],
    },
    reducers: {
        setFriends: (state, action) => {
            state.friends = action.payload; // Ustaw znajomych
        },
        setInvitations: (state, action) => {
            state.invitationsSent = action.payload; // Ustaw zaproszenia
        },
        addInvitation: (state, action) => {
            state.invitationsSent.push(action.payload); // Dodaj nowe zaproszenie
        },
        removeInvitation: (state, action) => {
            state.invitationsSent = state.invitationsSent.filter(invitation => invitation._id !== action.payload); // Usuń zaproszenie
        },
        removeFriend: (state, action) => {
            state.friends = state.friends.filter(friend => friend._id !== action.payload); // Usuń znajomego
        },
    },
});


export const {
    setFriends,
    setInvitations,
    addInvitation,
    removeInvitation,
    removeFriend
} = friendsSlice.actions;

export default friendsSlice.reducer;
