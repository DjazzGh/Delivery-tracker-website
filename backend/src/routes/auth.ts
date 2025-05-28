import express, { Request, Response } from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';

console.log('User model loaded');

const router = express.Router();

// Joi schema for signup
const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('vendor', 'delivery', 'customer').required().messages({
    'any.only': 'Invalid role',
    'any.required': 'Role is required',
  }),
  phoneNumber: Joi.string().required().messages({
    'any.required': 'Phone number is required',
  }),
  fullName: Joi.string().when('role', {
    is: 'customer',
    then: Joi.string().required().messages({
      'any.required': 'Full name is required for customers',
    }),
    otherwise: Joi.allow(null, ''),
  }),
  address: Joi.string().when('role', {
    is: 'customer',
    then: Joi.string().required().messages({
      'any.required': 'Address is required for customers',
    }),
    otherwise: Joi.allow(null, ''),
  }),
  businessName: Joi.string().when('role', {
    is: 'vendor',
    then: Joi.string().required().messages({
      'any.required': 'Business name is required for vendors',
    }),
    otherwise: Joi.allow(null, ''),
  }),
  vehicleType: Joi.string().when('role', {
    is: 'delivery',
    then: Joi.string().required().messages({
      'any.required': 'Vehicle type is required for delivery',
    }),
    otherwise: Joi.allow(null, ''),
  }),
  vehicleRegistrationNumber: Joi.string().when('role', {
    is: 'delivery',
    then: Joi.string().required().messages({
      'any.required': 'Vehicle registration is required for delivery',
    }),
    otherwise: Joi.allow(null, ''),
  }),
});

// Joi schema for login
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('vendor', 'delivery', 'customer').required().messages({
    'any.only': 'Invalid role',
    'any.required': 'Role is required',
  }),
});

router.post(
  '/signup',
  async (req: Request, res: Response): Promise<void> => {
    console.log('Signup request received:', req.body);

    // Validate request body with Joi
    const { error } = signupSchema.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('Validation errors:', error.details);
      res.status(400).json({
        errors: error.details.map((err) => ({
          type: 'field',
          msg: err.message,
          path: err.path.join('.'),
          location: 'body',
        })),
      });
      return;
    }
    console.log('Validation passed');

    try {
      const { email, password, role, fullName, phoneNumber, address, businessName, vehicleType, vehicleRegistrationNumber } = req.body;

      // Check existing user
      console.log('Checking existing user');
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Email already exists');
        res.status(400).json({ message: 'Email already exists' });
        return;
      }

      // Hash password
      console.log('Hashing password');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      console.log('Creating user');
      const userData = {
        email,
        password: hashedPassword,
        role,
        fullName: role === 'customer' ? fullName : undefined,
        phoneNumber,
        address: role === 'customer' ? address : undefined,
        businessName: role === 'vendor' ? businessName : undefined,
        vehicleType: role === 'delivery' ? vehicleType : undefined,
        vehicleRegistrationNumber: role === 'delivery' ? vehicleRegistrationNumber : undefined,
      };

      const user = new User(userData);
      await user.save();

      // Generate JWT
      console.log('Generating token');
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      console.log('Sending response');
      res.status(201).json({
        token,
        user: {
          id: user._id,
          email,
          role,
          fullName,
          phoneNumber,
          address,
          businessName,
          vehicleType,
          vehicleRegistrationNumber,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
);

router.post(
  '/login',
  async (req: Request, res: Response): Promise<void> => {
    console.log('Login request received:', req.body);

    // Validate request body with Joi
    const { error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('Validation errors:', error.details);
      res.status(400).json({
        errors: error.details.map((err) => ({
          type: 'field',
          msg: err.message,
          path: err.path.join('.'),
          location: 'body',
        })),
      });
      return;
    }
    console.log('Validation passed');

    try {
      const { email, password, role } = req.body;

      // Find user
      console.log('Finding user');
      const user = await User.findOne({ email, role });
      if (!user) {
        console.log('Invalid credentials or role');
        res.status(401).json({ message: 'Invalid credentials or role' });
        return;
      }

      // Check password
      console.log('Checking password');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Invalid credentials');
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Generate JWT
      console.log('Generating token');
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      console.log('Sending response');
      res.json({
        token,
        user: {
          id: user._id,
          email,
          role,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          address: user.address,
          businessName: user.businessName,
          vehicleType: user.vehicleType,
          vehicleRegistrationNumber: user.vehicleRegistrationNumber,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
);

export default router;