document.addEventListener("DOMContentLoaded", function() {
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    
    if (sidebarToggle && sidebar) {
        // Create an overlay element for mobile
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        overlay.style.zIndex = "999"; // Sits below the sidebar (z-index 1000)
        overlay.style.display = "none";
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.3s ease";
        document.body.appendChild(overlay);

        const toggleSidebar = () => {
            const isActive = sidebar.classList.toggle("active");
            if (isActive) {
                overlay.style.display = "block";
                // Small delay to allow transition
                setTimeout(() => overlay.style.opacity = "1", 10);
            } else {
                overlay.style.opacity = "0";
                setTimeout(() => overlay.style.display = "none", 300);
            }
        };

        // Click toggle button
        sidebarToggle.addEventListener("click", function(e) {
            e.stopPropagation();
            toggleSidebar();
        });

        // Click outside on the overlay
        overlay.addEventListener("click", function(e) {
            if (sidebar.classList.contains("active")) {
                toggleSidebar();
            }
        });

        // Handle resizing window back to desktop
        window.addEventListener("resize", function() {
            if (window.innerWidth > 992) {
                if (sidebar.classList.contains("active")) {
                    sidebar.classList.remove("active");
                    overlay.style.opacity = "0";
                    setTimeout(() => overlay.style.display = "none", 300);
                }
            }
        });
    }
});
