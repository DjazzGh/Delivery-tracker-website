import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['vendor', 'delivery', 'customer'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Customer-specific fields
  fullName: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },

  // Vendor-specific fields
  businessName: {
    type: String,
    trim: true,
  },

  // Delivery-specific fields
  vehicleType: {
    type: String,
    trim: true,
    enum: ['Bike', 'Car'],
  },
  vehicleRegistrationNumber: {
    type: String,
    trim: true,
  },
});

export default mongoose.model('User', userSchema);