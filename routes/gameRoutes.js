const express = require('express')
const router = express.Router()
const {
    createGame,
    updateGame,
    getGame,
} = require('../controllers/userController')

const { protect } = require('../middleware/authMiddleware')

router.post('/create', protect,createGame)
router.put('/update/:id',protect ,updateGame)
router.get('/:id',protect ,getGame)

module.exports = router