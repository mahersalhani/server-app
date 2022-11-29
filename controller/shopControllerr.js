const { default: mongoose } = require("mongoose");
const Shop = require("../model/shop.model");

exports.createShop = async (req, res, next) => {
  try {
    const shop = Shop.collection;

    res.status(201).json({
      status: "success",
      data: {
        shop,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
