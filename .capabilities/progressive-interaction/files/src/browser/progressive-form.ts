const historyMarker = "__progressiveForm";
type BrowserWindow = Window & typeof globalThis;

export function installProgressiveForms(documentObject = document, windowObject: BrowserWindow = window): () => void {
  const bypassedForms = new WeakSet<HTMLFormElement>();
  const activeRequests = new WeakMap<HTMLFormElement, AbortController>();

  const onSubmit = (event: Event): void => {
    if (!(event instanceof windowObject.SubmitEvent) || !(event.target instanceof windowObject.HTMLFormElement)) return;

    const form = event.target;
    if (bypassedForms.delete(form)) return;

    const targetSelector = form.dataset.progressiveTarget;
    const submission = targetSelector ? createSubmission(form, event.submitter, windowObject) : undefined;
    if (!targetSelector || !submission || !hasMatchingFragments(documentObject, targetSelector)) return;

    event.preventDefault();
    activeRequests.get(form)?.abort();

    const controller = new AbortController();
    activeRequests.set(form, controller);

    void submitAndReplace({
      controller,
      documentObject,
      submission,
      targetSelector,
      windowObject,
    })
      .catch(() => {
        if (controller.signal.aborted) return;
        bypassedForms.add(form);
        form.requestSubmit(event.submitter && form.contains(event.submitter) ? event.submitter : undefined);
      })
      .finally(() => {
        if (activeRequests.get(form) === controller) activeRequests.delete(form);
      });
  };

  const onPopState = (event: PopStateEvent): void => {
    if (isProgressiveHistoryState(event.state)) windowObject.location.reload();
  };

  documentObject.addEventListener("submit", onSubmit);
  windowObject.addEventListener("popstate", onPopState);

  return () => {
    documentObject.removeEventListener("submit", onSubmit);
    windowObject.removeEventListener("popstate", onPopState);
  };
}

interface Submission {
  init: RequestInit;
  url: URL;
}

interface SubmissionContext {
  controller: AbortController;
  documentObject: Document;
  submission: Submission;
  targetSelector: string;
  windowObject: BrowserWindow;
}

function createSubmission(form: HTMLFormElement, submitter: HTMLElement | null, windowObject: BrowserWindow): Submission | undefined {
  if (form.target && form.target !== "_self") return undefined;

  const method = form.method.toUpperCase();
  if (method !== "GET" && method !== "POST") return undefined;

  const url = new URL(form.action, windowObject.location.href);
  if (url.origin !== windowObject.location.origin) return undefined;
  if (submitter instanceof windowObject.HTMLInputElement && submitter.type === "image") return undefined;

  const formData = new windowObject.FormData(form);
  if ((submitter instanceof windowObject.HTMLButtonElement || submitter instanceof windowObject.HTMLInputElement) && submitter.name) {
    formData.append(submitter.name, submitter.value);
  }

  if (method === "GET") {
    const parameters = toSearchParameters(formData);
    if (!parameters) return undefined;
    url.search = parameters.toString();
    return { url, init: { method, headers: { accept: "text/html" } } };
  }

  if (form.enctype === "application/x-www-form-urlencoded") {
    const parameters = toSearchParameters(formData);
    if (!parameters) return undefined;
    return {
      url,
      init: {
        body: parameters,
        headers: {
          accept: "text/html",
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        method,
      },
    };
  }

  if (form.enctype === "multipart/form-data") {
    return { url, init: { body: formData, headers: { accept: "text/html" }, method } };
  }

  return undefined;
}

function toSearchParameters(formData: FormData): URLSearchParams | undefined {
  const parameters = new URLSearchParams();

  for (const [name, value] of formData) {
    if (typeof value !== "string") return undefined;
    parameters.append(name, value);
  }

  return parameters;
}

function hasMatchingFragments(documentObject: Document, selector: string): boolean {
  try {
    return documentObject.querySelector(selector)?.matches("[data-progressive-fragment]") ?? false;
  } catch {
    return false;
  }
}

async function submitAndReplace({
  controller,
  documentObject,
  submission,
  targetSelector,
  windowObject,
}: SubmissionContext): Promise<void> {
  const activeElement = documentObject.activeElement;
  const activeId = activeElement instanceof windowObject.HTMLElement ? activeElement.id : "";
  const response = await windowObject.fetch(submission.url, { ...submission.init, signal: controller.signal });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/html")) throw new Error("Expected a successful HTML response.");

  const nextDocument = new windowObject.DOMParser().parseFromString(await response.text(), "text/html");
  const currentFragment = documentObject.querySelector(targetSelector);
  const nextFragment = nextDocument.querySelector(targetSelector);
  if (!currentFragment?.matches("[data-progressive-fragment]") || !nextFragment?.matches("[data-progressive-fragment]")) {
    throw new Error("The declared progressive fragment was not present in the response.");
  }

  const replacement = documentObject.importNode(nextFragment, true);
  currentFragment.replaceWith(replacement);
  updateHistory(response.url || submission.url.href, windowObject);
  restoreFocus(activeId, replacement, documentObject, windowObject);
}

function updateHistory(responseUrl: string, windowObject: BrowserWindow): void {
  const nextUrl = new URL(responseUrl, windowObject.location.href);
  if (nextUrl.origin !== windowObject.location.origin || nextUrl.href === windowObject.location.href) return;

  if (!isProgressiveHistoryState(windowObject.history.state)) {
    windowObject.history.replaceState(markHistoryState(windowObject.history.state), "", windowObject.location.href);
  }
  windowObject.history.pushState(markHistoryState(undefined), "", nextUrl.href);
}

function restoreFocus(activeId: string, replacement: Element, documentObject: Document, windowObject: BrowserWindow): void {
  const preserved = activeId ? documentObject.getElementById(activeId) : null;
  const preferred = replacement.querySelector("[data-progressive-focus]");
  const target = preserved ?? preferred ?? replacement;

  if (target instanceof windowObject.HTMLElement) target.focus({ preventScroll: true });
}

function markHistoryState(state: unknown): Record<string, unknown> {
  return { ...(isRecord(state) ? state : {}), [historyMarker]: true };
}

function isProgressiveHistoryState(state: unknown): boolean {
  return isRecord(state) && state[historyMarker] === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
