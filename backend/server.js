const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Testing the MERN stack');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));