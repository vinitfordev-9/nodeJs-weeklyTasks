import * as service from './job.service.js';
import { RESPONSES, sendResponse } from '../common/responses.js';
export async function list(req, res) { return sendResponse(res, RESPONSES.JOBS, await service.listJobs(req.validated.query)); }
export async function get(req, res) { return sendResponse(res, RESPONSES.JOB, { data: await service.getJob(req.validated.params.id) }); }
export async function create(req, res) {
  const data = await service.createJob(req.user.id, req.validated.body);
  res.location(`/api/jobs/${data.id}`);
  return sendResponse(res, RESPONSES.JOB_CREATED, { data });
}
export async function update(req, res) { return sendResponse(res, RESPONSES.JOB_UPDATED, { data: await service.updateJob(req.validated.params.id, req.user.id, req.validated.body) }); }
export async function remove(req, res) { return sendResponse(res, RESPONSES.JOB_DELETED, { data: await service.deleteJob(req.validated.params.id, req.user.id) }); }
export async function mine(req, res) { return sendResponse(res, RESPONSES.JOBS, await service.companyJobs(req.user.id, req.validated.query)); }
