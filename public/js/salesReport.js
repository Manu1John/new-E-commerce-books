window.toggleCustomDates = function() {
    const filter = document.getElementById("filterType");
    if (!filter) return;
    
    const filterValue = filter.value;
    const customCols = document.querySelectorAll(".custom-date-col");
    
    if (filterValue === 'custom') {
        customCols.forEach(col => {
            col.classList.remove('d-none');
            const input = col.querySelector('input');
            if (input) input.setAttribute('required', 'true');
        });
    } else {
        customCols.forEach(col => {
            col.classList.add('d-none');
            const input = col.querySelector('input');
            if (input) input.removeAttribute('required');
        });
    }
};

document.addEventListener("DOMContentLoaded", function() {
    
    // Check initial state of custom dates
    window.toggleCustomDates();

    // Fetch the dynamically injected data from EJS
    const chartData = window.dynamicChartData;

    // Dynamic Line Chart Setup
    const lineChartElement = document.getElementById('lineChart');
    if (lineChartElement && chartData && chartData.line) {
        const lineCtx = lineChartElement.getContext('2d');
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: chartData.line.labels, // Dynamic Months
                datasets: [{
                    label: 'Revenue (₹)',
                    data: chartData.line.data, // Dynamic Revenue Array
                    borderColor: '#38bdf8', 
                    backgroundColor: '#38bdf8',
                    borderWidth: 3,
                    pointBackgroundColor: '#38bdf8',
                    pointRadius: 4,
                    tension: 0 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Dynamic Donut Chart Setup
    const donutChartElement = document.getElementById('donutChart');
    if (donutChartElement && chartData && chartData.donut) {
        const donutCtx = donutChartElement.getContext('2d');
        
        // Check if there is data, otherwise display a placeholder
        const hasData = chartData.donut.data.length > 0;

        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: hasData ? chartData.donut.labels : ['No Orders Yet'],
                datasets: [{
                    data: hasData ? chartData.donut.data : [1],
                    backgroundColor: hasData ? chartData.donut.colors : ['#e2e8f0'], 
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                cutout: '55%',
                plugins: {
                    legend: { display: hasData } // Hide legend if no data exists
                }
            }
        });
    }
});