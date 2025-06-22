const express = require('express')
const router = express.Router()

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Users endpoint - implementation pending'
  })
})

module.exports = router
