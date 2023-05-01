import { Infrastructure } from "../infrastructure/create";
import { Response } from "./responses";

export type Request = {
  params: Record<string, string>;
  data: object | null;
};

export type RequestHandler = (
  infrastructure: Infrastructure,
  request: Request
) => Promise<Response>;
