const express = require('express');
const User = require('../models/user'); 
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

router.post('/register', 
    [
        body('email').isEmail().withMessage('Enter a valid email address'),
        body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
        body('email').normalizeEmail(), 
        body('password').escape() 
    ],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || 'user'
        });

        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
        logger.info('User registered successfully');
    } catch (err) {
        logger.error(`Registration error: ${err}`);
        res.status(500).send('Server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// A protected route requiring authentication
router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Access to protected data', user: req.user });
});

// A route that requires a user to be an admin
router.get('/admin', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.json({ message: 'Admin data access', user: req.user });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        // Set token and expire time
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetUrl = `http://localhost:3000/api/users/reset-password/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a POST request to: \n\n ${resetUrl}`;

        await sendEmail({
            to: user.email,
            subject: 'Password reset token',
            text: message,
        });

        res.json({ msg: "Email sent if user exists in our database." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired password reset token" });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ msg: "Password updated successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
