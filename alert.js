const button = document.querySelector("button")
const toast = document.querySelector(".toast");
const closeIcon = document.querySelector(".close")
const progress = document.querySelector(".progress");

let timer1, timer2;

button.addEventListener("click", () => {
    window.location.href = "login.html";
    console.log('clicked')
});

closeIcon.addEventListener("click", () => {
    toast.classList.remove("active");
    console.log('clicked')
    window.location.replace("login.html");

    setTimeout(() => {
        progress.classList.remove("active");
    }, 300);

    clearTimeout(timer1);
    clearTimeout(timer2);
});
