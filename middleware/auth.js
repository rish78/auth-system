const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) return res.sendStatus(401); 

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403); 


        try {
            const user = await User.findById(decoded.user.id).select("-password");
            if (!user) return res.sendStatus(404); 

            req.user = user; 
            next();
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    });
};


const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" }); 
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };
