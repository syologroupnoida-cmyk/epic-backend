import stream from "stream";
import csv from "csv-parser";
import Vendor from "../models/Vendor.js";

const parseCount = (val) => {
  if (!val) return 0;

  val = val.toString().trim().toUpperCase();

  if (val.endsWith("K")) {
    return Math.round(parseFloat(val) * 1000);
  }

  if (val.endsWith("M")) {
    return Math.round(parseFloat(val) * 1000000);
  }

  return Number(val) || 0;
};

export const importVendors = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const results = [];

    // Convert buffer → stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", async () => {
        try {
          const savedVendors = [];

          for (let row of results) {

            const phone = row["Phone"]
            ?.replace(/\D/g, "")
            .replace(/^0+/, "");
            const exists_phone = await Vendor.findOne({ phone });

            if (exists_phone) {
                console.log("Duplicate skipped:", phone);
                continue;
            }
            const rawEmail =
            row["Email 1"] ||
            row["Email 2"] ||
            row["Email 3"];

            const email = rawEmail ? rawEmail.trim().toLowerCase() : undefined;

            if (email) {
                const exists_email = await Vendor.findOne({ email });

                if (exists_email) {
                    console.log("Duplicate skipped:", email);
                    continue;
                }
            }

            // Clean emails
            // const emails = [
            // row["Email 1"],
            // row["Email 2"],
            // row["Email 3"]
            // ]
            // .filter(Boolean)
            // .map(e => e.trim().toLowerCase());

            // if (!emails || emails.length === 0) continue;
            
            const vendor = new Vendor({
            vendorName: row["Company name"],

            profile: {
                public_id: "default_id",
                url: "https://dummyimage.com/200x200"
            },

            password: "12345678",

            experience: 0, // not in CSV → fallback
            workingSince: 2020, // not in CSV → fallback
            
            category: row["Category"],

            state: row["State"] || "Unknown", // fallback
            city: row["City"] || "Unknown", // fallback

            locality: row["City"] || "Unknown", // fallback

            address: row["Address"] || "Unknown", // fallback
            pincode: row["Pincode"] || "Unknown", // fallback

            location: {
                type: "Point",
                coordinates: [0,0] // temp fallback
            },
            ratingCount: parseCount(row["Rating count"]),
            reviewCount: parseCount(row["Review"]),
            contactPerson: row["Company name"],

            phone,

            email : email || "", 

            website: row["Website"] || "",
            });

            // IMPORTANT: triggers pre-save (hash + slug)
            await vendor.save();
            savedVendors.push(vendor);
          }

          res.status(200).json({
            success: true,
            message: "Vendors imported successfully",
            count: savedVendors.length
          });

        } catch (error) {
          res.status(500).json({
            success: false,
            message: error.message
          });
        }
      });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};