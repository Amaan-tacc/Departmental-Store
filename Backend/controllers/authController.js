// controllers/authController.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Store from '../models/Store.js';

// Generate JWT Token
const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Create and send token
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user: user.profile // Using the virtual property
    }
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    // 1) Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // 2) Get or create default store
    let store = await Store.findOne({ name: 'Main Store' });
    if (!store) {
      store = await Store.create({
        name: 'Main Store',
        address: {
          street: '123 Main Street',
          city: 'City',
          state: 'State',
          zipCode: '12345',
          country: 'Country'
        },
        phone: '(555) 123-4567',
        email: 'info@store.com',
        taxRate: 8.0,
        currency: 'USD'
      });
    }

    // 3) Create new user
    const newUser = await User.create({
      fullname,
      email,
      password,
      role,
      store: store._id
    });

    // 4) Send response with token
    createSendToken(newUser, 201, res, 'Registration successful');

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email })
      .select('+password')
      .populate('store', 'name address phone');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // 3) Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // 4) Check if password was changed after token was issued
    if (user.changedPasswordAfter(req.auth?.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'User recently changed password! Please log in again.'
      });
    }

    // 5) Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 6) Send token to client
    createSendToken(user, 200, res, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('store', 'name address phone taxRate currency');

    res.status(200).json({
      status: 'success',
      data: {
        user: user.profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving user profile'
    });
  }
};

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email } = req.body;
    
    // 1) Check if user wants to update email and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already taken'
        });
      }
    }

    // 2) Update user data
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { fullname, email },
      {
        new: true,
        runValidators: true
      }
    ).populate('store', 'name address phone');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
};

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1) Get user from collection
    const user = await User.findById(req.userId).select('+password');

    // 2) Check if current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is incorrect'
      });
    }

    // 3) Update password
    user.password = newPassword;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error changing password'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1) Get user based on POSTed email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a reset token has been sent.'
      });
    }

    // 2) Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email (implementation depends on your email service)
    // For now, we'll just return the token (in production, send via email)
    console.log(`Password reset token for ${email}: ${resetToken}`); // Remove in production

    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a reset token has been sent.',
      data: {
        resetToken // Remove this in production - only for testing
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Reset token fields in case of error
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      status: 'error',
      message: 'There was an error sending the email. Try again later.'
    });
  }
};

// @desc    Reset password
// @route   PATCH /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired'
      });
    }

    // 3) Update password and remove reset token fields
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res, 'Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error resetting password'
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('store', 'name address phone taxRate currency');

    res.status(200).json({
      status: 'success',
      data: {
        user: user.profile
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error verifying token'
    });
  }
};