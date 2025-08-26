const button = document.querySelector(".btn-primary");

button.addEventListener("click", () => {
  button.classList.toggle("active");
  console.log("ボタン押されました");
});
