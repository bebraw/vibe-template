export function markBrowserModuleReady(documentObject: Document = document): void {
  documentObject.documentElement.dataset.browserModule = "ready";
}

markBrowserModuleReady();
