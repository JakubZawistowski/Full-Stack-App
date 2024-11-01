import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Home() {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState("");
    const [newReply, setNewReply] = useState({});
    const [showReplies, setShowReplies] = useState({}); // Nowa zmienna do przechowywania stanu odpowiedzi
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        const fetchAllPosts = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:3002/api/posts", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPosts(response.data);
            } catch (error) {
                console.error("Error fetching posts:", error);
                setError("Error fetching posts");
            }
        };
        fetchAllPosts();
    }, [navigate]);

    const fetchComments = async (postId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:3002/api/posts/${postId}/comments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments(prevComments => ({
                ...prevComments,
                [postId]: response.data
            }));
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const addComment = async (postId) => {
        if (!newComment.trim()) return;
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:3002/api/posts/${postId}/comments`,
                { content: newComment },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNewComment("");
            fetchComments(postId); // Pobierz zaktualizowane komentarze
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const addReply = async (postId, commentId) => {
        if (!newReply[commentId]?.trim()) return; // Sprawdź, czy odpowiedź nie jest pusta
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Brak tokena uwierzytelnienia");
                return;
            }

            console.log("Token:", token); // Logowanie tokena

            const response = await axios.post(
                `http://localhost:3002/api/posts/${postId}/comments/${commentId}/replies`,
                { content: newReply[commentId] },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setNewReply(prevReplies => ({
                ...prevReplies,
                [commentId]: "" // Czyść pole odpowiedzi po dodaniu
            }));
            fetchComments(postId); // Pobierz zaktualizowane komentarze
        } catch (error) {
            console.error("Error adding reply:", error);
        }
    };


    const likeComment = async (postId, commentId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `http://localhost:3002/api/posts/${postId}/comments/${commentId}/like`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchComments(postId); // Pobierz zaktualizowane komentarze
        } catch (error) {
            console.error("Error liking comment:", error);
        }
    };

    const dislikeComment = async (postId, commentId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `http://localhost:3002/api/posts/${postId}/comments/${commentId}/dislike`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            fetchComments(postId); // Pobierz zaktualizowane komentarze
        } catch (error) {
            console.error("Error disliking comment:", error);
        }
    };

    const likePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:3002/api/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(posts.map(post =>
                post._id === postId ? response.data : post
            ));
        } catch (error) {
            console.error('Error liking post:', error);
            setError('Error liking post');
        }
    };

    const dislikePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:3002/api/posts/${postId}/dislike`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(posts.map(post =>
                post._id === postId ? response.data : post
            ));
        } catch (error) {
            console.error('Error disliking post:', error);
            setError('Error disliking post');
        }
    };

    const toggleReplies = (commentId) => {
        setShowReplies(prev => ({
            ...prev,
            [commentId]: !prev[commentId] // Przełącz stan widoczności odpowiedzi
        }));
    };

    if (!isAuthenticated) {
        return <p className="text-center text-gray-500">You need to log in to view posts.</p>;
    }
    console.log(comments)
    return (
        <div>
            <div className="container mx-auto p-4">
                {error && <p className="text-red-500">{error}</p>}

                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post._id} className="border p-4 mb-4 rounded-md shadow-md bg-white">
                            <div>
                                <p className="text-lg font-semibold">{post.content}</p>
                                {post.image && (
                                    <img
                                        src={`http://localhost:3002/uploads/${post.image}?${new Date().getTime()}`}
                                        alt="Post"
                                        className="max-w-full h-auto mt-2 rounded-md"
                                        style={{ maxWidth: '400px', height: 'auto' }}
                                    />
                                )}
                                <p className="text-sm text-gray-600 mt-2">
                                    Posted by: <span
                                    className="text-blue-500 cursor-pointer"
                                    onClick={() => navigate(`/users/${post.user._id}`)}
                                >
                                        {post.user.firstName} {post.user.lastName}
                                    </span>
                                </p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => likePost(post._id)}
                                    className="bg-green-500 text-white px-4 py-2 rounded mt-2 mr-2"
                                >
                                    Like ({post.likes.length})
                                </button>
                                <button
                                    onClick={() => dislikePost(post._id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                                >
                                    Dislike ({post.dislikes.length})
                                </button>
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="border p-2 w-full rounded mt-2"
                                />
                                <button
                                    onClick={() => addComment(post._id)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                                >
                                    Add Comment
                                </button>
                                <button
                                    onClick={() => fetchComments(post._id)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded mt-2 ml-2"
                                >
                                    Show Comments
                                </button>
                                {comments[post._id] && comments[post._id].length > 0 && (
                                    <div className="mt-4">
                                        {comments[post._id].map(comment => (
                                            <div key={comment._id} className="border-t mt-2 pt-2">
                                                <p className="text-sm text-gray-600">
                                                    {comment.user.firstName} {comment.user.lastName}
                                                </p>
                                                <p className="text-md">{comment.content}</p>
                                                <div className="flex items-center mt-2">
                                                    <button
                                                        onClick={() => likeComment(post._id, comment._id)}
                                                        className="bg-green-500 text-white px-2 py-1 rounded mt-1"
                                                    >
                                                        {comment.likes.includes(localStorage.getItem("userId")) ? "Unlike" : "Like"} ({comment.likes.length})
                                                    </button>
                                                    <button
                                                        onClick={() => dislikeComment(post._id, comment._id)}
                                                        className="bg-red-500 text-white px-2 py-1 rounded mt-1 ml-2"
                                                    >
                                                        {comment.dislikes.includes(localStorage.getItem("userId")) ? "Remove Dislike" : "Dislike"} ({comment.dislikes.length})
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Add a reply..."
                                                    value={newReply[comment._id] || ""}
                                                    onChange={(e) => setNewReply({ ...newReply, [comment._id]: e.target.value })}
                                                    className="border p-1 w-full mt-1 rounded"
                                                />
                                                <button
                                                    onClick={() => addReply(post._id, comment._id)}
                                                    className="bg-blue-500 text-white px-4 py-1 rounded mt-1"
                                                >
                                                    Reply
                                                </button>
                                                <button
                                                    onClick={() => toggleReplies(comment._id)} // Użyj nowej funkcji do przełączania
                                                    className="bg-gray-300 text-black px-4 py-1 rounded mt-1 ml-2"
                                                >
                                                    {showReplies[comment._id] ? "Hide Replies" : "Show Replies"} {/* Przełącz tekst przycisku */}
                                                </button>
                                                {showReplies[comment._id] && comment.replies && comment.replies.length > 0 && ( // Wyświetl odpowiedzi tylko jeśli stan showReplies jest true
                                                    <div className="mt-2 pl-4 border-l-2 border-gray-300">
                                                        {comment.replies.map(reply => ( // Teraz zakładamy, że reply to pełny obiekt, a nie ID
                                                            <div key={reply._id} className="border-t mt-2 pt-2">
                                                                <p className="text-sm text-gray-600">
                                                                    {reply.user.firstName} {reply.user.lastName}
                                                                </p>
                                                                <p className="text-md">{reply.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">No posts yet. Check back later!</p>
                )}
            </div>
        </div>
    );
}
