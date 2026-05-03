(function () {
  "use strict";
  const KEY = "rjgUserRole";
  let role = "";
  try {
    role = (sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || "").toLowerCase();
  } catch (e) {
    role = "";
  }
  if (!role) return;
  document.documentElement.setAttribute("data-rjg-role", role);
})();
