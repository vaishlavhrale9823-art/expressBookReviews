
const axios = require('axios');
const express = require('express');
const books = require('./booksdb.js');
const isValid = require('./auth_users.js').isValid;
const users = require('./auth_users.js').users;

const public_users = express.Router();

// Retrieve books using Axios when a real external data API is configured.
// Otherwise, use the local book database.
async function getBooks() {
    const apiUrl = process.env.BOOKS_API_URL;

    if (!apiUrl) {
        return books;
    }

    const response = await axios.get(apiUrl, {
        timeout: 5000
    });

    if (
        !response.data ||
        typeof response.data !== 'object' ||
        Array.isArray(response.data)
    ) {
        throw new Error('Invalid books API response');
    }

    return response.data;
}

// Reusable search function for author and title
function searchBooks(allBooks, field, searchValue) {
    const value = searchValue.trim().toLowerCase();

    return Object.values(allBooks).filter(book =>
        book &&
        typeof book[field] === 'string' &&
        book[field].toLowerCase() === value
    );
}

// Register a new user
public_users.post('/register', (req, res) => {
    const { username, password } = req.body || {};

    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password
    ) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    const cleanUsername = username.trim();

    if (isValid(cleanUsername)) {
        return res.status(409).json({
            message: 'User already exists'
        });
    }

    users.push({
        username: cleanUsername,
        password
    });

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
        console.error('Error retrieving books:', error.message);

        return res.status(502).json({
            message: 'Unable to retrieve books from the data service'
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
        console.error('Error retrieving book:', error.message);

        return res.status(502).json({
            message: 'Unable to retrieve book from the data service'
        });
    }
});

// Get books by author
public_users.get('/author/:author', async (req, res) => {
    try {
        const author = req.params.author;

        if (!author || !author.trim()) {
            return res.status(400).json({
                message: 'Author is required'
            });
        }

        const allBooks = await getBooks();
        const result = searchBooks(allBooks, 'author', author);

        if (result.length === 0) {
            return res.status(404).json({
                message: 'No books found for this author'
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error searching by author:', error.message);

        return res.status(502).json({
            message: 'Unable to search books by author'
        });
    }
});

// Get books by title
public_users.get('/title/:title', async (req, res) => {
    try {
        const title = req.params.title;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Title is required'
            });
        }

        const allBooks = await getBooks();
        const result = searchBooks(allBooks, 'title', title);

        if (result.length === 0) {
            return res.status(404).json({
                message: 'No books found with this title'
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error searching by title:', error.message);

        return res.status(502).json({
            message: 'Unable to search books by title'
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
