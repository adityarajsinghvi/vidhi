// Inlined into <head> as a blocking script so the correct theme class is
// present before first paint (no flash of the wrong mode).
export const THEME_STORAGE_KEY = "vidhi-theme";

export const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;
