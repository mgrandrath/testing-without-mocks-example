import { Infrastructure } from "../infrastructure/create";

export type Request = {
  params: Record<string, string>;
  data: object | null;
};

export type Response = {
  status: number;
  data: object | null;
};

export type RequestHandler = (
  infrastructure: Infrastructure,
  request: Request
) => Promise<Response>;
