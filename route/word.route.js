const express = require('express');
const router = express.Router();
const db = require('../db');
const {defineWord} =  require('../services/defineService');

router.get('/', async(req, res) => {
try{
    const { word } = req.query;
    if (!word) return res.status(400).json({ error: 'Missing word' });

    const result = await defineWord(word);
    res.json(result);
    
} catch(e){
    res.status(404).json({ error: e.message });
}

});
module.exports = router;