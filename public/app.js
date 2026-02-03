let chartInstance = null;

function setError(msg) {
    document.getElementById("error").textContent = msg || "";
}

function setMetric(id, value) {
    const el = document.getElementById(id);
    if (value === null || value === undefined || Number.isNaN(value)) {
        el.textContent = "-";
        return;
    }
    // keep it clean for report
    el.textContent = Number(value).toFixed(2);
}

function formatDateLabel(isoString) {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    // yyyy-mm-dd
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

async function fetchJSON(url) {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }
    return data;
}

async function loadData() {
    setError("");

    const field = document.getElementById("field").value;
    const start_date = document.getElementById("start_date").value; // "" or YYYY-MM-DD
    const end_date = document.getElementById("end_date").value;
    const chartType = document.getElementById("chartType").value;

    const params = new URLSearchParams({ field });

    if (start_date) params.set("start_date", start_date);
    if (end_date) params.set("end_date", end_date);

    const seriesUrl = `/api/measurements?${params.toString()}&page=1&limit=200`;
    const metricsUrl = `/api/measurements/metrics?${params.toString()}`;

    try {
        const [series, metrics] = await Promise.all([
            fetchJSON(seriesUrl),
            fetchJSON(metricsUrl)
        ]);

        // metrics
        setMetric("avg", metrics.avg);
        setMetric("min", metrics.min);
        setMetric("max", metrics.max);
        setMetric("stdDev", metrics.stdDev);

        // chart data
        const labels = series.data.map(p => formatDateLabel(p.timestamp));
        const values = series.data.map(p => p.value);

        const ctx = document.getElementById("chart");

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: chartType,
            data: {
                labels,
                datasets: [
                    {
                        label: field,
                        data: values
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    x: { ticks: { maxRotation: 0, autoSkip: true } }
                }
            }
        });
    } catch (err) {
        setError(err.message || "Unknown error");
        // clear metrics if error
        setMetric("avg", null);
        setMetric("min", null);
        setMetric("max", null);
        setMetric("stdDev", null);
        if (chartInstance) chartInstance.destroy();
        chartInstance = null;
    }
}

document.getElementById("loadBtn").addEventListener("click", loadData);

// Auto-load on page open
loadData();
