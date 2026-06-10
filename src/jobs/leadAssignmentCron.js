import { assignPricedLeads } from "../services/leadAssignmentService.js";

const INTERVAL_MS = Number(process.env.LEAD_ASSIGNMENT_INTERVAL_MS) || 2 * 60 * 1000;

export function startLeadAssignmentCron() {
  const run = async () => {
    try {
      const results = await assignPricedLeads();
      if (results.assigned > 0 || results.failed > 0) {
        console.log("[LeadAssignment]", results);
      }
    } catch (err) {
      console.error("[LeadAssignment] Error:", err.message);
    }
  };

  console.log(
    `[LeadAssignment] Cron started — runs every ${INTERVAL_MS / 1000}s`
  );

  setTimeout(run, 15000);
  setInterval(run, INTERVAL_MS);
}
