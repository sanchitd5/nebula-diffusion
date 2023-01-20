import mongoose, { Schema } from "mongoose";
import Config from "../../../config"

const forgetPasswordRequests = new Schema({
    customerID: { type: Schema.Types.ObjectId, ref: 'users' },
    userType: {
        type: String,
        enum: [
            Config.APP_CONSTANTS.DATABASE.USER_ROLES.USER
        ],
        required: true
    },
    isChanged: { type: Boolean, default: false },
    requestedAt: { type: Date },
    changedAt: { type: Date }
});

export default mongoose.model('forgetPasswordRequests', forgetPasswordRequests);