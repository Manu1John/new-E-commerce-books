document.addEventListener('DOMContentLoaded', function() {
    
    // Sidebar Toggle Logic for Mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    // Safely pull the chart data we injected via the EJS window variable
    const chartData = window.dashboardChartData || {}; 

    // Responsive Line Chart Options
    const revenueCanvas = document.getElementById('revenueChart');
    if (revenueCanvas && chartData.months && chartData.monthlyRevenue) {
        const ctxRev = revenueCanvas.getContext('2d');
        new Chart(ctxRev, {
            type: 'line',
            data: {
                labels: chartData.months,
                datasets: [{
                    label: 'Revenue (₹)',
                    data: chartData.monthlyRevenue,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#4f46e5',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Responsive Donut Chart
    const statusCanvas = document.getElementById('orderStatusChart');
    if (statusCanvas && chartData.orderStatusLabels && chartData.orderStatusCounts) {
        const ctxStatus = statusCanvas.getContext('2d');
        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: chartData.orderStatusLabels,
                datasets: [{
                    data: chartData.orderStatusCounts,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                }
            }
        });
    }
});