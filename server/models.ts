import mongoose from 'mongoose';

const transform = {
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (doc: any, ret: any) {
            ret.id = ret._id.toString();
            delete ret._id;
        },
    },
};

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'faculty'], default: 'faculty' },
    name: { type: String },
    email: { type: String },
    department: { type: String },
    createdAt: { type: Date, default: Date.now },
}, transform);

const hallSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: String, required: true },
    location: { type: String },
    amenities: { type: String },
    createdAt: { type: Date, default: Date.now },
}, transform);

const bookingSchema = new mongoose.Schema({
    hallId: { type: String, required: true },
    userId: { type: String, required: true },
    facultyName: { type: String },
    bookingReason: { type: String, required: true },
    bookingDate: { type: String, required: true }, // Store as "YYYY-MM-DD"
    period: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'booked', 'rejected', 'cancelled'],
        default: 'pending'
    },
    rejectionReason: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
}, transform);

export const User = mongoose.model('User', userSchema);
export const Hall = mongoose.model('Hall', hallSchema);
export const Booking = mongoose.model('Booking', bookingSchema);
