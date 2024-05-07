const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3300;

// the URL's to call to fetch the data
const POSTS_BASE_URL = "https://jsonplaceholder.typicode.com/posts";
const USERS_BASE_URL = "https://jsonplaceholder.typicode.com/users";
const COMMENTS_BASE_URL = "https://jsonplaceholder.typicode.com/posts";

// Cache for user data
let cachedUsers = [];

app.get("/api/posts", async (req, res) => {
  try {
    const start = parseInt(req.query.start, 10);
    const size = parseInt(req.query.size, 10);

    // get the posts
    const { data: posts } = await axios.get(POSTS_BASE_URL);

    if (start >= posts.length || isNaN(start) || isNaN(size)) {
      return res
        .status(404)
        .send(`No results for the current pagination parameters`);
    }

    // get and cache the users
    if (cachedUsers.length === 0) {
      const { data: users } = await axios.get(USERS_BASE_URL);
      cachedUsers = users;
    }

    // slice the posts according the pagination
    const pagination = posts.slice(start, start + size);

    // attach users and comments to the posts
    const postsDetail = await Promise.all(
      pagination.map(async (post) => {
        const user = cachedUsers.find((user) => user.id === post.userId);

        const { data: comments } = await axios.get(
          `${COMMENTS_BASE_URL}/${post.id}/comments`
        );

        return {
          ...post,
          user,
          comments,
        };
      })
    );

    res.status(200).json(postsDetail);
  } catch (err) {
    console.error("Server error: ", err);
    res.status(500).send("Server error occurred");
  }
});

app.listen(PORT, () => {
  console.log(`Server's up 🚀 on http://localhost:${PORT}`);
});
