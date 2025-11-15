document.addEventListener("DOMContentLoaded", function () {
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll(".sidebar nav a");

    menuLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });
});