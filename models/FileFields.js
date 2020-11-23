const mongoose = require('mongoose');

const FileFieldsSchema = new mongoose.Schema({
    idNumber: {
        type: String,
        require: true
    },
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    protected: {
        type: String,
        require: true
    },
    unprotected: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const FileFields = mongoose.model('PersonalData', FileFieldsSchema);

module.exports = FileFields;