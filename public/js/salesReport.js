// ==========================================
// CUSTOM DATE TOGGLE
// ==========================================

window.toggleCustomDates = function () {
    const filter = document.getElementById("filterType");
    if (!filter) return;

    const filterValue = filter.value;

    // Supports both possible HTML structures
    const customDateInputs = document.getElementById("customDateInputs");
    const customDateCols = document.querySelectorAll(".custom-date-col");

    if (filterValue === "custom") {
        // Show #customDateInputs
        if (customDateInputs) {
            customDateInputs.classList.remove("hidden");
            customDateInputs.classList.remove("d-none");
        }

        // Show .custom-date-col
        customDateCols.forEach(function (col) {
            col.classList.remove("d-none");
            const input = col.querySelector("input");
            if (input) {
                input.setAttribute("required", "required");
            }
        });

    } else {
        // Hide #customDateInputs
        if (customDateInputs) {
            customDateInputs.classList.add("hidden");
            customDateInputs.classList.add("d-none");
        }

        // Hide .custom-date-col
        customDateCols.forEach(function (col) {
            col.classList.add("d-none");
            const input = col.querySelector("input");
            if (input) {
                input.removeAttribute("required");
            }
        });
    }
};


// ==========================================
// DOM CONTENT LOADED
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Safely pull the chart data we injected via the EJS window variable
    const chartData = window.salesChartData || {}; 

    // ==========================================
    // INITIAL CUSTOM DATE STATE
    // ==========================================
    window.toggleCustomDates();

    // ==========================================
    // FILTER CHANGE EVENT
    // ==========================================
    const filterType = document.getElementById("filterType");
    if (filterType) {
        filterType.addEventListener("change", function () {
            window.toggleCustomDates();
        });
    }

    // ==========================================
    // MOBILE SIDEBAR TOGGLE
    // ==========================================
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", function () {
            sidebar.classList.toggle("active");
        });
    }

    // ==========================================
    // LINE CHART
    // ==========================================
    const lineChartElement = document.getElementById("lineChart");

    if (
        lineChartElement &&
        chartData &&
        chartData.line &&
        Array.isArray(chartData.line.labels) &&
        Array.isArray(chartData.line.data)
    ) {
        const lineCtx = lineChartElement.getContext("2d");

        new Chart(lineCtx, {
            type: "line",
            data: {
                labels: chartData.line.labels,
                datasets: [
                    {
                        label: "Revenue (₹)",
                        data: chartData.line.data,
                        borderColor: "#4F46E5",
                        backgroundColor: "rgba(79, 70, 229, 0.1)",
                        borderWidth: 3,
                        pointBackgroundColor: "#ffffff",
                        pointBorderColor: "#4F46E5",
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return "Revenue: ₹" +
                                    Number(context.raw || 0).toLocaleString("en-IN");
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return "₹" +
                                    Number(value).toLocaleString("en-IN");
                            }
                        },
                        grid: {
                            borderDash: [4, 4]
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } else {
        console.warn("Line chart data is missing or invalid.");
    }


    // ==========================================
    // DONUT CHART
    // ==========================================
    const donutChartElement = document.getElementById("donutChart");

    if (
        donutChartElement &&
        chartData &&
        chartData.donut &&
        Array.isArray(chartData.donut.data)
    ) {
        const donutCtx = donutChartElement.getContext("2d");

        const hasData =
            chartData.donut.data.length > 0 &&
            chartData.donut.data.some(function (value) {
                return Number(value) > 0;
            });

        // If there is no order data
        const donutLabels = hasData
            ? chartData.donut.labels
            : ["No Orders Yet"];

        const donutData = hasData
            ? chartData.donut.data
            : [1];

        const donutColors = hasData
            ? (
                chartData.donut.colors &&
                chartData.donut.colors.length > 0
                    ? chartData.donut.colors
                    : [
                        "#10b981",
                        "#3b82f6",
                        "#f59e0b",
                        "#ef4444",
                        "#6b7280"
                    ]
            )
            : ["#e2e8f0"];

        new Chart(donutCtx, {
            type: "doughnut",
            data: {
                labels: donutLabels,
                datasets: [
                    {
                        data: donutData,
                        backgroundColor: donutColors,
                        borderWidth: 0,
                        hoverOffset: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: {
                    legend: {
                        display: hasData,
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || "";
                                const value = Number(context.raw || 0);
                                return label + ": " + value;
                            }
                        }
                    }
                }
            }
        });
    } else {
        console.warn("Donut chart data is missing or invalid.");
    }
});