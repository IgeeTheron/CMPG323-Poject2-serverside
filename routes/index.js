const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const idValidatorSA = require('validator-sa');


const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
      cb(null, file.fieldname + path.extname(file.originalname));
  }
});

// Init uploud
const uploud = multer({
  storage,
  fileFilter: function(req, file, cb) {
      checkFileType(req, file, cb);
  }
//   limits: { fileSize: 10 }
}).single('file');

// Check File Type
function checkFileType(req, file, cb) {
    // Allowed ext
    const filetypes = /.xlsx|.json|.txt/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname && (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'text/plain' || file.mimetype === 'application/json')) {
        return cb(null, true);
    } else {
        req.fileValidationError = 'goes wrong on the mimetype';
        return cb(null, false, new Error('goes wrong on the mimetype'));
        
    }
}

const FileFields = require('../models/FileFields');

// Welcome page
router.get('/', (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {

    FileFields.find()
        .then(data => {
            res.render('dashboard', { databaseData: data, user: req.user });
        })
        .catch(err => console.log(err));
});

var nameOfF = '';

router.post('/dashboard', (req, res) => {
    uploud(req, res, (err) => {
        if (err) {
            req.flash('error', err.message);
            res.redirect('/dashboard');
        } else if (req.fileValidationError) {
            req.flash('error_msg', 'text, json and excell files Only');
            res.redirect('/dashboard');
        } else {
            if (req.file == null) {
                req.flash('error_msg', 'No File Selected!');
                res.redirect('/dashboard');
            } else {
                req.flash('success_msg', 'File uplouded sucesfuly');
                res.redirect('/dashboard');

                // xlxs file work
                if (path.extname(req.file.originalname) === '.xlsx') {
                    console.log("A excell file was added");

                    var wb = xlsx.readFile(path.join(__dirname, '..', 'uploads', req.file.filename));

                    var ws = wb.Sheets["Data"];

                    var data = xlsx.utils.sheet_to_json(ws);

                    for (let i = 0; i < data.length; i++) {
                        // initilise variables
                        const idN = `${data[i].SA_ID_Number}`.replace(/\s/g, '');
                        const fName = data[i].First_Name;
                        const lName = data[i].Last_Name;
                        const email = data[i].Email;
                        var protected = '';
                        var unprotected = '';

                        // Id test
                        if (idN != null != idN != undefined)
                        {
                            // Tests ID
                            if (idValidatorSA.isValidSouthAfricanIDNumber(idN))
                            {
                                protected = protected + '(idNumber)';
                            } else {
                                unprotected = unprotected + '(idNumber)';
                            }
                        } else {
                            unprotected = unprotected + '(idNumber)';
                        }

                        unprotected = unprotected + '(firstName)(lastName)';

                        //  email test
                        if (email != null || email != undefined) {
                            if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
                                protected = protected + '(email)';
                            } else {
                                unprotected = unprotected + '(email)';
                            }
                        } else {
                            unprotected = unprotected + '(email)';
                        }

                        // Test if id alredy exsists
                        FileFields.findOne({ idNumber: idN})
                            .then(personalData => {
                                if (personalData) {
                                    console.log(`Data already exsits that has this idNumber: ${idN}`)
                                } else {
                                    const newFileField = new FileFields({
                                        idNumber: idN,
                                        firstName: fName,
                                        lastName: lName,
                                        email: email,
                                        protected: protected,
                                        unprotected: unprotected
                                    })
                                    
                                    // Add clasification to database
                                    newFileField.save()
                                        .then(result => {
                                            console.log(result);
                                        })
                                        .catch(err => console.log(err));
                                }
                            })
                            .catch(err => console.log(err));
                    }
                    
                    // Text file work
                } else if (path.extname(req.file.originalname) === '.txt') {
                    console.log("A txt file was added");

                    var data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'uploads', req.file.filename)));

                    for (let i = 0; i < data.length; i++) {
                        // initilise variables
                        const idN = `${data[i].SA_ID_Number}`.replace(/\s/g, '');
                        const fName = data[i].First_Name;
                        const lName = data[i].Last_Name;
                        const email = data[i].Email;
                        var protected = '';
                        var unprotected = '';

                        // Id test
                        if (idN != null != idN != undefined)
                        {
                            // Test ID
                            if (idValidatorSA.isValidSouthAfricanIDNumber(idN))
                            {
                                protected = protected + '(idNumber)';
                            } else {
                                unprotected = unprotected + '(idNumber)';
                            }
                        } else {
                            unprotected = unprotected + '(idNumber)';
                        }

                        unprotected = unprotected + '(firstName)(lastName)';

                        //  email test
                        if (email != null || email != undefined) {
                            if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
                                protected = protected + '(email)';
                            } else {
                                unprotected = unprotected + '(email)';
                            }
                        } else {
                            unprotected = unprotected + '(email)';
                        }

                        // Test if id alredy exsists
                        FileFields.findOne({ idNumber: idN})
                            .then(personalData => {
                                if (personalData) {
                                    console.log(`Data already exsits that has this idNumber: ${idN}`)
                                } else {
                                    const newFileField = new FileFields({
                                        idNumber: idN,
                                        firstName: fName,
                                        lastName: lName,
                                        email: email,
                                        protected: protected,
                                        unprotected: unprotected
                                    })
                                    
                                    // Add clasification to database
                                    newFileField.save()
                                        .then(result => {
                                            console.log(result);
                                        })
                                        .catch(err => console.log(err));
                                }
                            })
                            .catch(err => console.log(err));
                    }

                    // json file work
                } else if (path.extname(req.file.originalname) === '.json') {
                    console.log("A json file was added");

                    var data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'uploads', req.file.filename)));

                    for (let i = 0; i < data.length; i++) {
                        // initilise variables
                        const idN = `${data[i].SA_ID_Number}`.replace(/\s/g, '');
                        const fName = data[i].First_Name;
                        const lName = data[i].Last_Name;
                        const email = data[i].Email;
                        var protected = '';
                        var unprotected = '';

                        // Id test
                        if (idN != null != idN != undefined)
                        {
                            // Test ID
                            if (idValidatorSA.isValidSouthAfricanIDNumber(idN))
                            {
                                protected = protected + '(idNumber)';
                            } else {
                                unprotected = unprotected + '(idNumber)';
                            }
                        } else {
                            unprotected = unprotected + '(idNumber)';
                        }

                        unprotected = unprotected + '(firstName)(lastName)';

                        //  email test
                        if (email != null || email != undefined) {
                            if (/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
                                protected = protected + '(email)';
                            } else {
                                unprotected = unprotected + '(email)';
                            }
                        } else {
                            unprotected = unprotected + '(email)';
                        }

                        // Test if id alredy exsists
                        FileFields.findOne({ idNumber: idN})
                            .then(personalData => {
                                if (personalData) {
                                    console.log(`Data already exsits that has this idNumber: ${idN}`)
                                } else {
                                    const newFileField = new FileFields({
                                        idNumber: idN,
                                        firstName: fName,
                                        lastName: lName,
                                        email: email,
                                        protected: protected,
                                        unprotected: unprotected
                                    })
                                    
                                    // Add clasification to database
                                    newFileField.save()
                                        .then(result => {
                                            console.log(result);
                                        })
                                        .catch(err => console.log(err));
                                }
                            })
                            .catch(err => console.log(err));
                    }
                } else {
                    console.log('Somthing went wrong');
                }
            }
        }
    });
});

module.exports = router;