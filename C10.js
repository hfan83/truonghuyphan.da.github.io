document.addEventListener('DOMContentLoaded', () => {
    function drawCharts() {
        d3.csv("data.csv").then(rawData => {
            const margin = { top: 70, right: 50, bottom: 120, left: 60 },
                  width = 600 - margin.left - margin.right,
                  height = 300 - margin.top - margin.bottom;

            const tooltip = d3.select(".tooltip");

            const nestedData = d3.rollup(
                rawData,
                v => {
                    const uniqueOrders = new Set(v.map(m => m["Mã đơn hàng"])).size;
                    const itemCounts = d3.rollup(v,
                        g => new Set(g.map(m => m["Mã đơn hàng"])).size,
                        m => `[${m["Mã mặt hàng"]}] ${m["Tên mặt hàng"]}`
                    );
                    const items = Array.from(itemCounts).map(([key, value]) => ({
                        MatHang: key,
                        totalOrders: value,
                        probability: value / uniqueOrders
                    }));
                    items.sort((a, b) => b.probability - a.probability);
                    return items;
                },
                d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
            );

            let chartIndex = 1;
            nestedData.forEach((items, tenNhomHang) => {
                if (chartIndex > 5) return;

                const chartId = `chart10-${chartIndex}`;
                const svgContainer = d3.select(`#${chartId}`);

                const svg = svgContainer.append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", -margin.top / 2)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "16px")
                    .attr("font-weight", "bold")
                    .attr("fill", "#4e79a7")
                    .text(tenNhomHang);

                const color = d3.scaleOrdinal()
                    .domain(items.map(d => d.MatHang))
                    .range(d3.schemeTableau10);

                const y = d3.scaleBand()
                    .domain(items.map(d => d.MatHang))
                    .range([0, height])
                    .padding(0.2);

                const x = d3.scaleLinear()
                    .domain([0, d3.max(items, d => d.probability)])
                    .nice()
                    .range([0, width]);

                svg.append("g")
                    .call(d3.axisLeft(y))
                    .selectAll("text")
                    .style("font-size", "12px")
                    .style("text-anchor", "end");

                svg.append("g")
                    .attr("transform", `translate(0, ${height})`)
                    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));

                svg.selectAll(".bar")
                    .data(items)
                    .enter()
                    .append("rect")
                    .attr("class", "bar")
                    .attr("y", d => y(d.MatHang))
                    .attr("x", 0)
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(d.probability))
                    .attr("fill", d => color(d.MatHang))
                    .on("mouseover", function (event, d) {
                        tooltip.style("display", "block")
                            .html(`
                                Mặt hàng: <strong>${d.MatHang}</strong><br>
                                Nhóm hàng: ${tenNhomHang}<br>
                                SL Đơn Bán: ${d3.format(",")(d.totalOrders)}<br>
                                Xác suất bán/Nhóm hàng: ${d3.format(".1%")(d.probability)}
                            `);
                        d3.select(this).style("opacity", 0.7);
                    })
                    .on("mousemove", function (event) {
                        tooltip.style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 20) + "px");
                    })
                    .on("mouseout", function () {
                        tooltip.style("display", "none");
                        d3.select(this).style("opacity", 1);
                    });

                svg.selectAll(".label")
                    .data(items)
                    .enter()
                    .append("text")
                    .attr("class", "label")
                    .attr("x", d => x(d.probability) + 5)
                    .attr("y", d => y(d.MatHang) + y.bandwidth() / 2 + 5)
                    .text(d => d3.format(".1%")(d.probability))
                    .style("font-size", "12px")
                    .style("fill", "black");

                const legend = svg.append("g")
                    .attr("transform", `translate(${width / 2 - 250}, ${height + 40})`);

                const legendItems = items.map(d => d.MatHang);
                legendItems.forEach((itemName, i) => {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const legendRow = legend.append("g")
                        .attr("transform", `translate(${col * 250}, ${row * 20})`);

                    legendRow.append("rect")
                        .attr("width", 10)
                        .attr("height", 10)
                        .attr("fill", color(itemName));

                    legendRow.append("text")
                        .attr("x", 15)
                        .attr("y", 10)
                        .attr("font-size", "12px")
                        .attr("alignment-baseline", "middle")
                        .text(itemName);
                });

                chartIndex++;
            });
        }).catch(error => {
            console.error("Lỗi khi load file CSV:", error);
        });
    }

    document.querySelector('button[onclick="showChart(\'chart10\')"]').addEventListener('click', () => {
        d3.selectAll("#chart10 svg").remove();
        drawCharts();
    });
});