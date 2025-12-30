import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import "./Dashboard.css";

const API_URL = API_BASE_URL;

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Post cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/api/posts`,
        {
          content: content,
          visibility: "public",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setContent("");
      onPostCreated(response.data);
    } catch (err) {
      console.error("Post creation error:", err);
      setError("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-post-form">
      {error && <p className="post-error">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind, Sakina?"
        rows="4"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
};

const PostItem = ({ post }) => {
  return (
    <div className="post-item">
      <div className="post-header">
        <span className="post-author">{post.user.name || "Anonymous"}</span>
        <span className="post-date">
          {new Date(post.created_at).toLocaleString()}
        </span>
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-actions">
        <button>Like</button>
        <button>Comment</button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/posts`);
      setPosts(response.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    // To show the new post immediately, we need to fetch the user info
    // For simplicity, we'll just refetch all posts.
    fetchPosts();
  };

  return (
    <div className="dashboard-container">
      <CreatePost onPostCreated={handlePostCreated} />
      <div className="post-feed">
        {loading ? (
          <p>Loading posts...</p>
        ) : (
          posts.map((post) => <PostItem key={post.post_id} post={post} />)
        )}
      </div>
    </div>
  );
};

export default Dashboard;
