import Lead from "../models/Lead.js";
import Vendor from "../models/Vendor.js";

const CITY_ALIASES = [
  ["delhi", "new delhi", "delhi ncr", "ncr"],
  ["mumbai", "bombay"],
  ["bengaluru", "bangalore"],
  ["kolkata", "calcutta"],
  ["chennai", "madras"],
  ["hyderabad", "secunderabad"],
];

export function normalizeLocation(value) {
  if (!value) return "";
  return String(value).toLowerCase().trim().replace(/\s+/g, " ");
}

function matchesAliasGroup(a, b) {
  for (const group of CITY_ALIASES) {
    const aInGroup = group.some(
      (alias) => a.includes(alias) || alias.includes(a)
    );
    const bInGroup = group.some(
      (alias) => b.includes(alias) || alias.includes(b)
    );
    if (aInGroup && bInGroup) return true;
  }
  return false;
}

export function locationsMatch(leadLoc, vendorLoc) {
  const a = normalizeLocation(leadLoc);
  const b = normalizeLocation(vendorLoc);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return matchesAliasGroup(a, b);
}

export async function findVendorForLead(lead) {
  const leadCity = lead.location?.city;
  const leadState = lead.location?.state;

  const vendors = await Vendor.find({ status: "active" })
    .select("_id city state vendorName createdAt")
    .sort({ createdAt: 1 })
    .lean();

  const cityMatches = vendors.filter((v) => locationsMatch(leadCity, v.city));
  if (cityMatches.length) return cityMatches[0];

  if (leadState) {
    const normalizedState = normalizeLocation(leadState);
    const stateMatches = vendors.filter(
      (v) => normalizeLocation(v.state) === normalizedState
    );
    if (stateMatches.length) return stateMatches[0];
  }

  return null;
}

export async function assignPricedLeads() {
  const leads = await Lead.find({
    assignmentStatus: "priced",
    status: "active",
    purchasedBy: { $size: 0 },
  })
    .sort({ adminPricedAt: 1 })
    .limit(50);

  const results = { assigned: 0, failed: 0, details: [] };

  for (const lead of leads) {
    const vendor = await findVendorForLead(lead);

    if (!vendor) {
      await Lead.findByIdAndUpdate(lead._id, {
        assignmentStatus: "assignment_failed",
        assignmentNote: `No active vendor found for ${
          lead.location?.city || "unknown city"
        }`,
      });
      results.failed++;
      results.details.push({
        leadId: lead._id,
        status: "failed",
        reason: "No matching vendor",
      });
      continue;
    }

    const updated = await Lead.findOneAndUpdate(
      {
        _id: lead._id,
        assignmentStatus: "priced",
        purchasedBy: { $size: 0 },
      },
      {
        $set: {
          assignmentStatus: "assigned",
          assignedVendor: vendor._id,
          assignedAt: new Date(),
          assignmentNote: "",
        },
        $push: {
          purchasedBy: {
            vendor: vendor._id,
            pricePaid: lead.price,
            method: "auto_assign",
          },
          vendorInteractions: {
            vendor: vendor._id,
            stage: "new",
            priority: "medium",
          },
        },
      },
      { new: true }
    );

    if (updated) {
      results.assigned++;
      results.details.push({
        leadId: lead._id,
        vendorId: vendor._id,
        vendorName: vendor.vendorName,
        status: "assigned",
      });
    }
  }

  return results;
}
