import handler, { config } from "../src/vercel/reviewer-recruitment-handler.mjs";

export { config };

export function recruitmentIntakeOpen(environment = process.env) {
  return String(environment.RECRUITMENT_INTAKE_OPEN ?? "").toLowerCase() === "true";
}

export default async function reviewerRecruitmentGate(request, response) {
  if (request.method === "POST" && !recruitmentIntakeOpen()) {
    response.setHeader?.("cache-control", "no-store, max-age=0");
    response.setHeader?.("content-type", "application/json; charset=utf-8");
    response.statusCode = 410;
    response.end(
      JSON.stringify({
        error: "recruitment_intake_closed",
        detail: "The July 2026 reviewer intake has closed. No application was recorded.",
      }),
    );
    return;
  }

  return handler(request, response);
}
