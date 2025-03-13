const express = require('express');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static('public'));
app.use(express.static('views'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 