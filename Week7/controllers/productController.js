const Joi = require("joi");
const Product = require("../models/productModel");
const productSchema = require("../validations/productValidation");

// ✅ CREATE product
exports.createProduct = async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // Get image URLs
  const imagePaths = req.files.map((file) => ({
    url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
    alt: file.originalname,
  }));

  const newProduct = new Product({
    ...req.body,
    images: imagePaths,
    createdBy: req.user.userId,
  });

  const saved = await newProduct.save();
  res.status(201).json(saved);
};

// ✅ UPDATE product
exports.updateProduct = async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Upload images if sent
    let imageData = product.images; // keep old images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path || `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        alt: file.originalname
      }));
      imageData = [...imageData, ...newImages]; // merge old + new
    }

    // Update fields
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        images: imageData
      },
      { new: true }
    );

    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
};


// ✅ GET ALL products
exports.getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

// ✅ GET single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch {
    res.status(400).json({ message: "Invalid ID" });
  }
};

// ✅ DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch {
    res.status(400).json({ message: "Invalid ID" });
  }
};
