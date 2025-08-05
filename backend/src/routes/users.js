const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const { prisma } = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

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

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/profile',
  authenticateToken,
  [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('name').optional().isString().withMessage('Name must be a string')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        })
      }

      const userId = req.user.id
      const { email, phone, name } = req.body

      console.log('Updating user profile for user ID:', userId)
      console.log('Update data:', { email, phone, name })

      // Check if at least one field is provided
      if (email === undefined && phone === undefined && name === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No fields to update',
            details: [{ msg: 'Please provide at least one field to update' }]
          }
        })
      }

      // Check if email is already taken by another user
      if (email !== undefined) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: email,
            id: {
              not: userId
            }
          }
        })

        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Email already exists',
              details: [{ path: 'email', msg: 'This email is already registered to another account' }]
            }
          })
        }
      }

      // Build update data object dynamically
      const updateData = {}
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone
      if (name !== undefined) updateData.name = name
      updateData.updatedAt = new Date()

      console.log('Prisma update data:', updateData)

      // Update user with Prisma
      const updatedUser = await prisma.user.update({
        where: {
          id: userId
        },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      })

      console.log('User profile updated successfully:', updatedUser)

      res.json({
        success: true,
        message: 'User profile updated successfully',
        data: {
          user: updatedUser
        }
      })

    } catch (error) {
      console.error('Error updating user profile:', error)

      // Handle Prisma specific errors
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found'
          }
        })
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update user profile',
          details: error.message
        }
      })
    }
  }
)

module.exports = router
