
const axios = require('axios');
const express = require('express');
const books = require('./booksdb.js');
const isValid = require('./auth_users.js').isValid;
const users = require('./auth_users.js').users;

const public_users = express.Router();

// Retrieve books.
// Use Axios if an actual data API URL is configured;
// otherwise, use the project's local booksdb.js.
async function getBooks() {
    const apiUrl = process.env.BOOKS_API_URL;

    if (apiUrl) {
        const response = await axios.get(apiUrl);
        return response.data;
    }

    return books;
}

// Register a new user
public_users.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    if (isValid(username)) {
        return res.status(409).json({
            message: 'User already exists'
        });
    }

    users.push({ username, password });

    return res.status(200).json({
        message: 'User successfully registered. Now you can login'
    });
});

// Get all books
public_users.get('/', async (req, res) => {
    try {
        const allBooks = await getBooks();
        return res.status(200).json(allBooks);
    } catch (error) {
        return res.status(502).json({
            message: 'Unable to retrieve books'
        });
    }
});

// Get book details by ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
    try {
        const allBooks = await getBooks();
        const book = allBooks[req.params.isbn];

        if (!book) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        return res.status(200).json(book);
    } catch (error) {
        return res.status(502).json({
            message: 'Unable to retrieve book'
        });
    }
});

// Get books by author
public_users.get('/author/:author', async (req, res) => {
    try {
        const allBooks = await getBooks();
        const author = req.params.author.toLowerCase();

        const result = Object.values(allBooks).filter(book =>
            book.author &&
            book.author.toLowerCase() === author
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(502).json({
            message: 'Unable to search by author'
        });
    }
});

// Get books by title
public_users.get('/title/:title', async (req, res) => {
    try {
        const allBooks = await getBooks();
        const title = req.params.title.toLowerCase();

        const result = Object.values(allBooks).filter(book =>
            book.title &&
            book.title.toLowerCase() === title
        );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(502).json({
            message: 'Unable to search by title'
        });
    }
});

// Get reviews for a book
public_users.get('/review/:isbn', (req, res) => {
    const book = books[req.params.isbn];

    if (!book) {
        return res.status(404).json({
            message: 'Book not found'
        });
    }

    return res.status(200).json(book.reviews || {});
});

module.exports.general = public_users;
