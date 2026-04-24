// import asyncHandler from "../utils/asyncHandler.js";
// import ErrorResponse from "../utils/ErrorResponse.js";
// import SuccessResponse from "../utils/SuccessResponse.js";
// import SystemSetting from "../models/SystemSetting.js";
import Product from "../models/Product.js";


// 🔹 POST /products (CREATE)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// 🔹 GET /products (LIST with filters + pagination)
export const getProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
      sort = "-createdAt",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = { isActive: true };

    // 🔍 Search
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // 📂 Category
    if (category) {
      filter.category = category;
    }

    // 💰 Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// 🔹 GET /products/:id (DETAIL)
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("reviews.user", "name email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// 🔹 PUT /products/:id (UPDATE)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// 🔹 DELETE /products/:id (SOFT DELETE)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted (soft delete)",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};