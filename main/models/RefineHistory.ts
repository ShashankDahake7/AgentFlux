// models/RefineHistory.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRefineHistory extends Document {
    sheetId: string;
    diffReport: { [filename: string]: string };
    mergedFiles: { [filename: string]: string };
    timestamp: Date;
}

const RefineHistorySchema: Schema = new Schema({
    sheetId: { type: String, required: true },
    diffReport: { type: Object, required: true },
    mergedFiles: { type: Object, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.RefineHistory ||
    mongoose.model<IRefineHistory>("RefineHistory", RefineHistorySchema);
