const express = require('express');
const app = express();

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/client', (req, res) => {
    res.render('client');
});

app.get('/editor', (req, res) => {
    res.render('editor');
});

const port = 3000;
app.listen(port, () => {
    console.log(`App http://localhost:${port}/`);
});