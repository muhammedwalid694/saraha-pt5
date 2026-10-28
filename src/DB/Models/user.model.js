import mongoose from "mongoose";
import { GenderEnum, ProvidersEnum, RolesEnum } from "../../Common/enums/user.enum.js";

const isLocal = function () {
    return this.provider === ProvidersEnum.LOCAL;
};

// One entry per OTP purpose. The code itself is stored as a bcrypt hash.
const otpEntrySchema = new mongoose.Schema({
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },   // wrong guesses for the current code
    sentAt: Date                               // used for the resend cool-down
}, { _id: false });

const otpsSchema = new mongoose.Schema({
    confirmation: otpEntrySchema,   // confirm email after sign up
    resetPassword: otpEntrySchema,  // forgot password
    login: otpEntrySchema,          // 2nd step of login (two-step verification)
    enableTwoStep: otpEntrySchema   // proves the email works before turning 2-step on
}, { _id: false });

const profilePictureSchema = new mongoose.Schema({
    url: String,        // "/uploads/profile/x.png" (local) or the Cloudinary secure_url
    publicId: String,   // Cloudinary only
    storage: { type: String, enum: ["local", "cloudinary"] }
}, { _id: false });

const userSchema = new mongoose.Schema({
    // The (lowercased) email is the document's real _id instead of an ObjectId.
    _id: { type: String },
    firstName: { type: String, required: true, minLength: 2, maxLength: 20, lowercase: true, trim: true },
    // Google accounts may not have a family name / age / phone / password.
    lastName: { type: String, required: isLocal, minLength: 2, maxLength: 20, lowercase: true, trim: true },
    age: { type: Number, required: isLocal, min: 1, max: 120, index: true },
    gender: { type: String, enum: Object.values(GenderEnum), default: GenderEnum.MALE },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: isLocal, select: false },
    phoneNumber: { type: String, required: isLocal },
    otps: { type: otpsSchema, select: false },
    isConfirmed: { type: Boolean, default: false },
    twoStepEnabled: { type: Boolean, default: false },
    // Max login attempts: wrong-password counter + temporary lock (never sent to the client).
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    role: { type: String, enum: Object.values(RolesEnum), default: RolesEnum.USER },
    provider: { type: String, enum: Object.values(ProvidersEnum), default: ProvidersEnum.LOCAL },
    GoogleSub: String,
    // Tokens issued before this date are rejected (set when the password changes).
    credentialsChangedAt: Date,
    profilePicture: profilePictureSchema
}, {
    _id: false,
    id: false,
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.password;
            delete ret.otps;
            delete ret.loginAttempts;
            delete ret.lockUntil;
            delete ret.__v;
            return ret;
        }
    }
});

userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName ?? ""}`.trim();
});
userSchema.methods.getFullName = function () {
    return this.fullName;
};

// Fill the custom _id from the email right before validation runs.
userSchema.pre("validate", function (next) {
    if (!this._id) this._id = this.email;
    next();
});

userSchema.virtual("Message", {
    ref: "Messages",
    localField: "_id",
    foreignField: "receiverId"
});

const user = mongoose.model("user", userSchema);
export default user;
