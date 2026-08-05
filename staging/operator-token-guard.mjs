let pendingInviteToken = "";
const nativeFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = async (...args) => {
  const response = await nativeFetch(...args);
  try {
    const requestUrl = String(args[0] instanceof Request ? args[0].url : args[0] ?? "");
    if (response.ok && requestUrl.includes("action=invite.create")) {
      const payload = await response.clone().json();
      const token = payload?.data?.token;
      if (typeof token === "string" && token.length > 0) pendingInviteToken = token;
    }
  } catch {
    // Token presentation is a UI convenience. The authenticated API response remains authoritative.
  }
  return response;
};

const observer = new MutationObserver(() => {
  if (!pendingInviteToken) return;
  const field = document.querySelector("#issued-token");
  if (!field) return;
  field.value = pendingInviteToken;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  pendingInviteToken = "";
});

observer.observe(document.documentElement, { childList: true, subtree: true });
