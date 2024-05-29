const express = require('express');
const path = require('path');
const mysql = require('mysql');
const session = require('express-session');

const app = express();
const port = 3000;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'shruti',
    password: 'root',
    database: 'login'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL server:', err);
        return;
    }
    console.log('Connected to MySQL server');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

function executeQuery(sql, values) {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/cart', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'cart.html'));
});

app.get('/cart-data', (req, res) => {
    res.json({ cart: req.session.cart || [] });
});

app.post('/add-to-cart', (req, res) => {
    const { name, price, image } = req.body;

    if (!name || !price || !image) {
        return res.status(400).send('Invalid product data');
    }

    const product = { name, price, image, quantity: 1 };

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingProduct = req.session.cart.find(item => item.name === name);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        req.session.cart.push(product);
    }

    res.status(200).send('Product added to cart');
});

app.post('/remove-from-cart', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).send('Invalid product data');
    }

    if (!req.session.cart) {
        return res.status(400).send('Cart is empty');
    }

    req.session.cart = req.session.cart.filter(item => item.name !== name);
    res.status(200).send('Product removed from cart');
});

app.post('/clear-cart', (req, res) => {
    req.session.cart = [];
    res.status(200).send('Cart cleared');
});

app.post('/signup', async (req, res) => {
    const { username, email_id, password } = req.body;

    try {
        await executeQuery('INSERT INTO login_details (username, email_id, password) VALUES (?, ?, ?)', [username, email_id, password]);
        res.redirect('/login');
    } catch (error) {
        res.status(500).send('Failed to sign up');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await executeQuery('SELECT * FROM login_details WHERE username = ? AND password = ?', [username, password]);

        if (users.length > 0) {
            req.session.username = username;
            res.redirect('/dashboard');
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        res.status(500).send('Failed to login');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
