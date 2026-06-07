import crypto from "crypto";
import xlsx from "xlsx";
import Vendor from "../models/Vendor.js";
import ErrorResponse from "../utils/ErrorResponse.js";

const DEFAULT_PROFILE = {
  public_id: "epic-uploads/defaults/default_avatar",
  url: "https://res.cloudinary.com/dntsyzdh3/image/upload/v1703173095/epic-uploads/defaults/default_avatar.jpg",
};

const DEFAULT_COORDINATES = [77.209, 28.6139];

const REQUIRED_FIELDS = [
  "vendorName",
  "email",
  "phone",
  "password",
  "experience",
  "workingSince",
  "contactPerson",
  "state",
  "city",
  "locality",
  "address",
];

const HEADER_ALIASES = {
  vendorname: "vendorName",
  name: "vendorName",
  brandname: "vendorName",
  email: "email",
  phone: "phone",
  mobile: "phone",
  password: "password",
  experience: "experience",
  workingsince: "workingSince",
  contactperson: "contactPerson",
  state: "state",
  city: "city",
  locality: "locality",
  address: "address",
  pincode: "pincode",
  category: "category",
  vendortype: "category",
};

const normalizeHeader = (header) =>
  String(header || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();

const normalizeRow = (row) => {
  const normalized = {};

  Object.entries(row).forEach(([key, value]) => {
    const alias = HEADER_ALIASES[normalizeHeader(key)];
    if (!alias) return;

    if (value == null || value === "") return;

    if (["experience", "workingSince"].includes(alias)) {
      const num = Number(value);
      if (!Number.isNaN(num)) normalized[alias] = num;
      return;
    }

    if (alias === "password") {
      normalized[alias] = String(value).trim();
      return;
    }

    if (alias === "phone") {
      normalized[alias] = String(value).replace(/\D/g, "").slice(-10);
      return;
    }

    if (alias === "email") {
      normalized[alias] = String(value).trim().toLowerCase();
      return;
    }

    normalized[alias] = String(value).trim();
  });

  return normalized;
};

export const parseVendorSpreadsheet = (buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new ErrorResponse(400, "Spreadsheet is empty");
  }

  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  const parsed = rows
    .map(normalizeRow)
    .filter((row) => Object.keys(row).length > 0);

  if (!parsed.length) {
    throw new ErrorResponse(400, "No vendor rows found in file");
  }

  return parsed;
};

export const bulkImportVendors = async (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ErrorResponse(400, "No vendor data provided");
  }

  const results = {
    successCount: 0,
    errors: [],
    totalRows: rows.length,
  };

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const vendor = rows[i];

    const missingField = REQUIRED_FIELDS.find((field) => {
      const val = vendor[field];
      return val === undefined || val === null || val === "";
    });

    if (missingField) {
      results.errors.push({
        row: rowNumber,
        email: vendor.email || "N/A",
        message: `Missing required field: ${missingField}`,
      });
      continue;
    }

    if (!/^\d{10}$/.test(vendor.phone)) {
      results.errors.push({
        row: rowNumber,
        email: vendor.email,
        message: "Invalid phone number (must be exactly 10 digits)",
      });
      continue;
    }

    try {
      const existingVendor = await Vendor.findOne({
        $or: [{ email: vendor.email }, { phone: vendor.phone }],
      });

      if (existingVendor) {
        results.errors.push({
          row: rowNumber,
          email: vendor.email,
          message: "Email or phone number already exists",
        });
        continue;
      }

      const newVendor = new Vendor({
        vendorName: vendor.vendorName,
        email: vendor.email,
        phone: vendor.phone,
        password: vendor.password,
        experience: Number(vendor.experience),
        workingSince: Number(vendor.workingSince),
        contactPerson: vendor.contactPerson,
        state: vendor.state,
        city: vendor.city,
        locality: vendor.locality,
        address: vendor.address,
        pincode: vendor.pincode || undefined,
        category: vendor.category || undefined,
        profile: DEFAULT_PROFILE,
        location: {
          type: "Point",
          coordinates: DEFAULT_COORDINATES,
        },
        status: "pending",
        kycStatus: "not_started",
      });

      await newVendor.save();
      results.successCount++;
    } catch (error) {
      results.errors.push({
        row: rowNumber,
        email: vendor.email || "N/A",
        message: error.message || "Failed to save vendor",
      });
    }
  }

  return results;
};

export const generateDefaultPassword = () =>
  crypto.randomBytes(8).toString("hex");
