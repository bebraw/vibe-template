import { createHealthResponse } from "./api/health";
import { exampleRoutes } from "./app-routes";
import { renderHomePage } from "./views/home";
import { renderNotFoundPage } from "./views/not-found";
import { htmlResponse } from "./views/shared";

export default {
  fetch(request: Request): Response {
    return handleRequest(request);
  },
};

export function handleRequest(request: Request): Response {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    return htmlResponse(renderHomePage(exampleRoutes));
  }

  if (url.pathname === "/api/health") {
    return createHealthResponse(exampleRoutes.map((route) => route.path));
  }

  return htmlResponse(renderNotFoundPage(url.pathname), 404);
}
