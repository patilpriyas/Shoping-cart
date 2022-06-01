const validator = require("../utils/validator")
const productModel = require("../models/productModel")
const { uploadFile } = require("../AWSUpload/aws_s3")



const createProduct = async function (req, res) {

    try {
        // Validate body
        const body = req.body
        if (!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Please provide details" });
        }

        // Extract params from body
        let { title, description, price, currencyId, currencyFormat, style, availableSizes, installments, productImage } = body

        // Check Title is Present or not
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "Product Title must be present" })
        }

        // Validate Title

        if (!validator.isValidString(title)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid Product Title` })
        }

        // Check Unique Title
        const isTitleAlreadyExist = await productModel.findOne({ title: title })
        if (isTitleAlreadyExist) {
            return res.status(400).send({ status: false, message: "Title is already Exist" })
        }

        // Check Description is Present or not
        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: "Product Description must be present" })
        }

        // Validate Description
        if (!validator.isValidString(description)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid Product description` })
        }

        // Check Price is present or not
        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, message: "Product Price must be present" })
        }

        // Validate Price
        if (!validator.isValidPrice(price)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid Product Price` })
        }

        // Check CurrencyId present or not
        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "CurrencyId must be present" })
        }

        // Validate CurrencyId
        if (!validator.isvalidCurrencyId(currencyId)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid CurrencyId` })
        }

        // Check CurrencyFormat present or not
        if (!validator.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "CurrencyFormat must be present" })
        }

        // Validate CurrencyFormat
        if (!validator.isvalidCurrencyFormat(currencyFormat)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid CurrencyFormat` })
        }

        // Validate the  style 
        if (style && !validator.isValidString(style)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid Product Style` })
        }

        // Validate the Available Sizes 
        if (availableSizes && !validator.isValidSize(availableSizes)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid Product Available Sizes` })
        }

        if (availableSizes) {
            availableSizes = validator.isValidSize(availableSizes);
        }

        //  Validate Installments
        if (installments && !validator.isvalidNum(installments)) {
            return res.status(400).send({ status: false, message: `Please Enter Valid Product Installments` })
        }
        
         // Validate Files
         let files = req.files
         if (files && files.length > 0) {
             if (!validator.isValidImage(files[0])) {
                 return res.status(400).send({ status: false, message: `Invalid Image Type` })
             }
         }
 
         // Upload Files
         let uploadedFileURL = await uploadFile(files[0]);
         productImage = uploadedFileURL

        const productData = { title, description, price, currencyId, currencyFormat, style, availableSizes, installments, productImage }
        const productCreated = await productModel.create(productData)

        return res.status(201).send({ status: true, message: "Product created successfully", data: productCreated })

    } catch (err) {
        console.log(err)
        res.status(500).send({ msg: "server error", error: err.message });
    }
}

const getProducts = async function (req, res) {

    try{
        

    }catch(err){

    }


}

module.exports = { createProduct, getProducts }
