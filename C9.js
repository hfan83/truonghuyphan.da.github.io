document.addEventListener('DOMContentLoaded', () => {
    function drawCharts() {
        d3.csv("data.csv").then(rawData => {
            const margin = { top: 70, right: 50, bottom: 120, left: 60 },
                  width = 600 - margin.left - margin.right,
                  height = 300 - margin.top - margin.bottom; 

            const tooltip = d3.select(".tooltip");

            const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
            rawData.forEach(d => {
                d["Thời gian tạo đơn"] = parseDate(d["Thời gian tạo đơn"]);
                d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1;
                d["Mã đơn hàng"] = d["Mã đơn hàng"].trim();
                d["Nhóm gộp"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
                d["Mặt hàng gộp"] = `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`;
            });

            const groupByMonthGroupItem = d3.rollups(
                rawData,
                v => ({
                    count: new Set(v.map(d => d["Mã đơn hàng"])).size
                }),
                d => d["Tháng"],
                d => d["Nhóm gộp"],
                d => d["Mặt hàng gộp"]
            );

            const groupByMonthGroup = d3.rollups(
                rawData,
                v => new Set(v.map(d => d["Mã đơn hàng"])).size,
                d => d["Tháng"],
                d => d["Nhóm gộp"]
            );

            const totalOrdersByGroupMonthObj = {};
            groupByMonthGroup.forEach(([month, groups]) => {
                groups.forEach(([group, count]) => {
                    totalOrdersByGroupMonthObj[`${month}-${group}`] = count;
                });
            });

            const data = [];
            groupByMonthGroupItem.forEach(([month, groups]) => {
                groups.forEach(([groupName, items]) => {
                    const totalInGroupMonth = totalOrdersByGroupMonthObj[`${month}-${groupName}`] || 1;
                    items.forEach(([itemName, itemData]) => {
                        data.push({
                            month: +month,
                            group: groupName,
                            item: itemName,
                            count: itemData.count,
                            probability: itemData.count / totalInGroupMonth
                        });
                    });
                });
            });

            const dataGroup = d3.groups(data, d => d.group);

            let chartIndex = 1;
            dataGroup.forEach(([groupName, groupData]) => {
                if (chartIndex > 5) return;

                const chartId = `chart9-${chartIndex}`;
                const svg = d3.select(`#${chartId}`)
                    .append("svg")
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
                    .text(groupName);

                const x = d3.scaleLinear()
                    .domain(d3.extent(groupData, d => d.month))
                    .range([0, width]);

                const minY = d3.min(groupData, d => d.probability);
                const maxY = d3.max(groupData, d => d.probability);
                const y = d3.scaleLinear()
                    .domain([Math.max(0, minY - 0.1), Math.min(1, maxY + 0.1)])
                    .range([height, 0]);

                const color = d3.scaleOrdinal(d3.schemeTableau10);
                const itemsGroup = d3.groups(groupData, d => d.item);
                const line = d3.line()
                    .x(d => x(d.month))
                    .y(d => y(d.probability));

                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x).ticks(12).tickFormat(d => `T${String(d).padStart(2, '0')}`));

                svg.append("g")
                    .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

                itemsGroup.forEach(([itemName, itemData]) => {
                    svg.append("path")
                        .datum(itemData)
                        .attr("fill", "none")
                        .attr("stroke", color(itemName))
                        .attr("stroke-width", 2)
                        .attr("d", line);

                    svg.selectAll(".dot")
                        .data(itemData)
                        .enter()
                        .append("circle")
                        .attr("cx", d => x(d.month))
                        .attr("cy", d => y(d.probability))
                        .attr("r", 5)
                        .attr("fill", color(itemName))
                        .on("mouseover", (event, d) => {
                            tooltip.style("display", "block")
                                .html(`
                                    <strong>Tháng:</strong> T${String(d.month).padStart(2, '0')}<br>
                                    <strong>Nhóm hàng:</strong> ${d.group}<br>
                                    <strong>Mặt hàng:</strong> ${d.item}<br>
                                    <strong>Xác suất bán:</strong> ${(d.probability * 100).toFixed(2)}%
                                `);
                        })
                        .on("mousemove", (event) => {
                            tooltip.style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 20) + "px");
                        })
                        .on("mouseout", () => {
                            tooltip.style("display", "none");
                        });
                });

                const legend = svg.append("g")
                    .attr("transform", `translate(${width / 2 - 250}, ${height + 40})`); 

                const legendItems = itemsGroup.map(([itemName]) => itemName);
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
            console.error("Lỗi load dữ liệu:", error);
        });
    }

    document.querySelector('button[onclick="showChart(\'chart9\')"]').addEventListener('click', () => {
        d3.selectAll("#chart9 svg").remove();
        drawCharts();
    });
});