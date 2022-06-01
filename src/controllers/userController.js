const validator = require("../utils/validator")
const userModel = require('../models/userModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { uploadFile } = require("../AWSUpload/aws_s3")
const jwt = require('jsonwebtoken')


//------------------ CREATING USER
const createUser = async (req, res) => {

    try {
        // Validate body
        const body = req.body
        if (!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Invalid request, Please provide Details" });
        }

        // Validate query
        const query = req.query;
        if (validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters" });
        }

        // Extract params
        let { fname, lname, email, phone, password, address } = body

        // fname Validation 
        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, message: 'Firstname is Required' });
        }

        if (!validator.isValidString(fname)) {
            return res.status(400).send({ status: false, message: 'Please enter valid Firstname' });
        }

        // lname Validation
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, message: 'Lastname is Required' });
        }

        if (!validator.isValidString(lname)) {
            return res.status(400).send({ status: false, message: 'Please enter valid Lastname' });
        }

        // Email Validation
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: 'Email is Required' });
        }

        if (!validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: 'Please Enter Valid Email' });
        }

        // Check Unique Email
        const isEmailAlreadyUsed = await userModel.findOne({ email: email });
        if (isEmailAlreadyUsed) {
            return res.status(400).send({ status: false, message: `${email} Email is already registered` })
        }

        // Phone Validation
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: 'Phone number is Required' });
        }

        if (!validator.isValidNumber(phone)) {
            return res.status(400).send({ status: false, message: 'Please Enter Valid Phone number' });
        }

        // Check unique Phone 
        const isPhoneAlreadyUsed = await userModel.findOne({ phone: phone });
        if (isPhoneAlreadyUsed) {
            return res.status(400).send({ status: false, message: `${phone} Phone is already registered` })
        }

        // Password Validation
        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, msg: "Password is required" })
        }

        if (!validator.isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "Please Enter valid Password" })
        }

        // encrypted password
        const encryptPassword = await bcrypt.hash(password, 10)

        //address = JSON.parse(address)

        // Address Validation
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, message: "Address is required" })
        }

        // shipping address Validation
        if (!validator.isValid(address.shipping)) {
            return res.status(400).send({ status: false, message: "Shipping address is required" })
        }

        // Street, City, Pincode of Shipping address validation
        if (!validator.isValid(address.shipping.street && address.shipping.city && address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Shipping address details is/are missing" })
        }

        // Shipping pincode Validation
        if (!validator.isValidPincode(address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: "Invalid Shipping pincode" })
        }

        // Billing address Validation
        if (!validator.isValid(address.billing)) {
            return res.status(400).send({ status: false, message: "Billing address is required" })
        }

        // Street, City, Pincode of Billing address validation
        if (!validator.isValid(address.billing.street && address.billing.city && address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Billing address details is/are missing" })
        }

        // Billing Pincode Validation
        if (!validator.isValidPincode(address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: "Invalid billing pincode" })
        }

        //ProfileImage Validation
        let files = req.files;
        if (!validator.isValid(files)) {
            return res.status(400).send({ status: false, message: "File is required" })
        }

        if (files && files.length > 0) {
            if (!validator.isValidImage(files[0])) {
                return res.status(400).send({ status: false, message: "Invalid Image type" })
            }
        }
        // Upload ProfileImage
        let uploadedFileURL = await uploadFile(files[0]);
        profileImage = uploadedFileURL

        const userData = { fname, lname, email, profileImage, phone, password: encryptPassword, address }
        const savedData = await userModel.create(userData)

        return res.status(201).send({ status: true, message: "User created successfully", data: savedData })

    } catch (err) {
        console.log(err)
        res.status(500).send({ msg: "server error", error: err.message });
    }
};

const login = async function (req, res) {
    try {

        //Validate body 
        const body = req.body;
        if (!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "User body should not be empty" });
        }

        // Validate query (it must not be present)
        const query = req.query;
        if (validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters" });
        }

        // Validate params (it must not be present)
        const params = req.params;
        if (validator.isValidBody(params)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters" });
        }

        // Extract params
        let email = body.email;
        let password = body.password;

        // Validate email
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "email must be present" })
        }

        // Validation of email id
        if (!validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Invalid email id" })
        }

        // Validate password
        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: "password must be present" })
        }

        //Validation of password
        if (!validator.isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Invalid password" })
        }

        if (email && password) {
            let user = await userModel.findOne({ email })
            if (!user) {
                return res.status(404).send({ status: false, message: "Email does not exist. Kindly create a new user" })
            }

            let pass = await bcrypt.compare(password, user.password);
            if (pass) {
                const Token = jwt.sign({
                    userId: user._id,
                    iat: Math.floor(Date.now() / 1000), //issue date
                    exp: Math.floor(Date.now() / 1000) + 60 * 60 //expiry date and time (30*60 = 30 min || 60*60 = 1 hr)
                }, "Group8")
                res.header('x-api-key', Token)

                return res.status(200).send({ status: true, message: "User login successfull", data: { userId: user._id, token: Token } })
            }
            else {
                return res.status(400).send({ status: false, message: "Invalid password" })
            }
        }

    } catch (err) {
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

const getUserById = async function (req, res) {
    try {

        // Validate params
        const params = req.params;
        if (!validator.isValidBody(params)) {
            return res.status(400).send({ status: false, msg: "Please provide ID " })
        }

        const userId = req.params.userId

        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, msg: "UserId is Not Vaild" })
        }

        // Check User Exist
        const usereDtails = await userModel.findById({ _id: userId })
        if (!usereDtails) {
            return res.status(404).send({ status: false, msg: "User Not Found with this ID" })

        }

        return res.status(200).send({ status: true, msg: "User profile details", data: usereDtails })

    } catch (err) {
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

const updateUserById = async (req, res) => {
    try {
        //Validate body 
        const body = req.body;
        if (!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "User body should not be empty" });
        }

        // Validate query (it must not be present)
        const query = req.query;
        if (validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters" });
        }

        // Validate params
        const params = req.params;
        if (!validator.isValidBody(params)) {
            return res.status(400).send({ status: false, msg: "Please provide ID " })
        }

        const userId = req.params.userId
        if (!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, msg: "UserId is Not Vaild" })
        }

        let { fname, lname, email, phone, password, address, profileImage } = body

        // fname Validation 
        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, message: 'Firstname is Required' });
        }

        if (!validator.isValidString(fname)) {
            return res.status(400).send({ status: false, message: 'Please enter valid Firstname' });
        }

        // lname Validation
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, message: 'Lastname is Required' });
        }

        if (!validator.isValidString(lname)) {
            return res.status(400).send({ status: false, message: 'Please enter valid Lastname' });
        }

        // Email Validation
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: 'Email is Required' });
        }

        if (!validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: 'Please Enter Valid Email' });
        }

        // Check Unique Email
        const isEmailAlreadyUsed = await userModel.findOne({ email: email });
        if (isEmailAlreadyUsed) {
            return res.status(400).send({ status: false, message: `${email} Email is already registered` })
        }

        // Phone Validation
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: 'Phone number is Required' });
        }

        if (!validator.isValidNumber(phone)) {
            return res.status(400).send({ status: false, message: 'Please Enter Valid Phone number' });
        }

        // Check unique Phone 
        const isPhoneAlreadyUsed = await userModel.findOne({ phone: phone });
        if (isPhoneAlreadyUsed) {
            return res.status(400).send({ status: false, message: `${phone} Phone is already registered` })
        }

        // Password Validation
        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, msg: "Password is required" })
        }

        if (!validator.isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "Please Enter valid Password" })
        }

        // encrypted password
        const encryptPassword = await bcrypt.hash(password, 10)

        //address = JSON.parse(address)

        // Address Validation
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, message: "Address is required" })
        }

        // shipping address Validation
        if (!validator.isValid(address.shipping)) {
            return res.status(400).send({ status: false, message: "Shipping address is required" })
        }

        // Street, City, Pincode of Shipping address validation
        if (!validator.isValid(address.shipping.street && address.shipping.city && address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Shipping address details is/are missing" })
        }

        // Shipping pincode Validation
        if (!validator.isValidPincode(address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: "Invalid Shipping pincode" })
        }

        // Billing address Validation
        if (!validator.isValid(address.billing)) {
            return res.status(400).send({ status: false, message: "Billing address is required" })
        }

        // Street, City, Pincode of Billing address validation
        if (!validator.isValid(address.billing.street && address.billing.city && address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Billing address details is/are missing" })
        }

        // Billing Pincode Validation
        if (!validator.isValidPincode(address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: "Invalid billing pincode" })
        }

        // ProfileImage Validation
        let files = req.files;
        if (!validator.isValid(files)) {
            return res.status(400).send({ status: false, message: "File is required" })
        }

        if (files && files.length > 0) {
            if (!validator.isValidImage(files[0])) {
                return res.status(400).send({ status: false, message: "Invalid Image type" })
            }
        }

        // Upload ProfileImage
        let uploadedFileURL = await uploadFile(files[0]);
        profileImage = uploadedFileURL

        // Update User Data
        const userData = { fname, lname, email, phone, password: encryptPassword, address, profileImage }
        const updatedData = await userModel.findOneAndUpdate({ _id: userId }, userData, { new: true })

        res.status(200).send({ status: true, msg: "Profile Updated Successfully", data: updatedData })

    } catch (err) {
        res.status(500).send({ msg: "Error", error: err.message })
    }
}


module.exports = { createUser, login, getUserById, updateUserById }
