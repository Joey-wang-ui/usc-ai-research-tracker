import leads from "./leads.json";
import { emptyContact, emptyOpportunity } from "../lib/model";
import type { AppState, Opportunity } from "../types";
export function createSeed(): AppState {
  const state: AppState = {
    schemaVersion: 1,
    opportunities: [],
    contacts: [],
    tasks: [],
    histories: [],
    activities: [],
    theme: "dark",
  };
  for (const lead of leads) {
    const o: Opportunity = {
      ...emptyOpportunity(),
      id: lead.id,
      name: lead.Name,
      organization: lead.Organization,
      areas: lead.Areas.split(", "),
      priority: lead.Priority as Opportunity["priority"],
      type: lead.Type,
      sourceUrl: lead.url,
      contactEmail: lead.Email || "",
      compensation: lead.Compensation === "Unpaid" ? "Unpaid" : "Unknown",
      workMode: lead["Work Mode"] === "On-site" ? "On-site" : "Unknown",
      availability: lead.Availability
        ? "Historical / Potentially Closed"
        : "Needs Verification",
      notes:
        "用户提供的历史研究线索；当前开放情况、资格与具体要求请重新查阅官方来源。",
    };
    const contactName =
      lead.Contact ||
      (lead.Email === "penkova@usc.edu" ? "Professor Penkova" : "");
    if (contactName) {
      let c = state.contacts.find((c) => c.name === contactName);
      if (!c) {
        c = {
          ...emptyContact(),
          id: `contact-${lead.id}`,
          name: contactName,
          lab: lead.Organization,
          email: lead.Email || "",
          areas: lead.Areas,
        };
        state.contacts.push(c);
      }
      o.contactId = c.id;
    }
    state.opportunities.push(o);
  }
  return state;
}
