document.getElementById("year").textContent = new Date().getFullYear();
const menu = document.querySelector(".menu");
const links = document.querySelector(".nav-links");
menu?.addEventListener("click", () => {
  links.style.display = links.style.display === "flex" ? "" : "flex";
  if (links.style.display === "flex") {
    links.style.position = "absolute";
    links.style.top = "79px";
    links.style.right = "14px";
    links.style.left = "14px";
    links.style.padding = "18px";
    links.style.background = "#fff";
    links.style.border = "1px solid #e5eaf2";
    links.style.borderRadius = "14px";
    links.style.flexDirection = "column";
    links.style.alignItems = "stretch";
  }
});