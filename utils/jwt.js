import jwt from 'jsonwebtoken';

const generateJWT = (userId) => {
    const payload = { _id: userId };
    const options = { expiresIn: '1h' };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, options);
    return token;
};

export { generateJWT };