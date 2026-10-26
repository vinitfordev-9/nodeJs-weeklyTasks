import * as service from "./application.service.js";
import { RESPONSES, sendResponse } from "../common/responses.js";
export async function apply(req, res) {
  return sendResponse(res, RESPONSES.APPLIED, {
    data: await service.apply(
      req.validated.params.id,
      req.user.id,
      req.validated.body,
      req.file,
    ),
  });
}
export async function applicants(req, res) {
  return sendResponse(
    res,
    RESPONSES.APPLICATIONS,
    await service.applicants(
      req.validated.params.id,
      req.user.id,
      req.validated.query,
    ),
  );
}
export async function mine(req, res) {
  return sendResponse(
    res,
    RESPONSES.APPLICATIONS,
    await service.myApplications(req.user.id, req.validated.query),
  );
}
export async function update(req, res) {
  return sendResponse(res, RESPONSES.APPLICATION_UPDATED, {
    data: await service.updateStatus(
      req.validated.params.id,
      req.user.id,
      req.validated.body.status,
    ),
  });
}
export async function download(req, res) {
  const file = await service.resume(req.validated.params.id, req.user);
  res.set("Cache-Control", "no-store");
  console.log("test", file);
  return res
    .type("application/pdf")
    .attachment(file.resumeName)
    .send(Buffer.from(file.resumeBytes));
}
