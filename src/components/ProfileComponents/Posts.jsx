import React, {useState, useEffect, useContext} from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { UserContext } from './UserProfile';

export default function Posts() {
    const { currentUserId } = useContext(UserContext);
    let { userId } = useParams();
    const [posts, setPosts] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [newImage, setNewImage] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [editedImage, setEditedImage] = useState(null);
    const [error, setError] = useState(null);

    let isOwnProfile = false;
    if (userId === undefined) {
        userId = currentUserId;
        isOwnProfile = true;
    }

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:3002/api/posts/${userId}/posts`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPosts(response.data);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setError('Error fetching posts');
            }
        };
        fetchPosts();
    }, [userId]);

    const startEditing = (post) => {
        setEditingPostId(post._id);
        setEditedContent(post.content);
        setEditedImage(null);
    };

    const savePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', editedContent);
            if (editedImage) {
                formData.append('image', editedImage);
            }

            const response = await axios.put(`http://localhost:3002/api/posts/${postId}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const updatedPost = response.data;

            setPosts(posts.map(post =>
                post._id === postId ? { ...post, content: editedContent, image: updatedPost.image } : post
            ));
            setEditingPostId(null);
        } catch (error) {
            console.error('Error updating post:', error);
            setError('Error updating post');
        }
    };

    const cancelEditing = () => {
        setEditingPostId(null);
        setEditedContent('');
        setEditedImage(null);
    };

    const addPost = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', newContent);
            if (newImage) {
                formData.append('image', newImage);
            }

            const response = await axios.post('http://localhost:3002/api/posts', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setPosts([response.data, ...posts]);
            setNewContent('');
            setNewImage(null);
        } catch (error) {
            console.error('Error adding post:', error);
            setError('Error adding post');
        }
    };

    // Funkcja do usuwania posta
    const deletePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3002/api/posts/del/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Zaktualizuj stan, usuwając post z listy
            setPosts(posts.filter(post => post._id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            setError('Error deleting post');
        }
    };

    return (
        <div>
            {error && <p className="text-red-500">{error}</p>}

            {isOwnProfile && (
                <form onSubmit={addPost} className="border p-4 mb-4">
                    <textarea
                        className="border w-full p-2 mb-2"
                        placeholder="What's on your mind?"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        className="mb-2"
                        onChange={(e) => setNewImage(e.target.files[0])}
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700">
                        Add Post
                    </button>
                </form>
            )}

            {posts.length > 0 ? (
                posts.map(post => (
                    <div key={post._id} className="border p-4 mb-4">
                        {editingPostId === post._id ? (
                            <div>
                                <textarea
                                    className="border w-full p-2 mb-2"
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="mb-2"
                                    onChange={(e) => setEditedImage(e.target.files[0])}
                                />
                                <button
                                    className="bg-green-500 text-white px-4 py-2 mr-2"
                                    onClick={() => savePost(post._id)}
                                >
                                    Save
                                </button>
                                <button
                                    className="bg-gray-500 text-white px-4 py-2"
                                    onClick={cancelEditing}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p>{post.content}</p>
                                {post.image && (
                                    <img
                                        src={`http://localhost:3002/uploads/${post.image}?${new Date().getTime()}`}
                                        alt="Post"
                                        className="w-96 h-96 object-cover"
                                    />
                                )}
                                <p className="text-sm text-gray-600">
                                    Posted by: {post.user?.firstName} {post.user?.lastName}
                                </p>
                                {isOwnProfile && (
                                    <div>
                                        <button
                                            className="bg-yellow-500 text-white px-4 py-2 mt-2"
                                            onClick={() => startEditing(post)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-red-500 text-white px-4 py-2 mt-2 ml-2"
                                            onClick={() => deletePost(post._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p>No posts yet. Add a new post above!</p>
            )}
        </div>
    );
}
