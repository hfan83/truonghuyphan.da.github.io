d3.csv("data.csv").then(rawData => {
    const width = 1300;
    const height = 600;
    const margin = { top: 50, right: 200, bottom: 50, left: 250 }; 

    const svg = d3.select("#chart8")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif") // Font chữ mặc định
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

    rawData.forEach(d => {
        d["Thời gian tạo đơn"] = parseDate(d["Thời gian tạo đơn"]);
        d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1;
        d["Mã đơn hàng"] = d["Mã đơn hàng"].trim();
        d["Nhóm gộp"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
    });

    const groupByMonthGroup = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"],
        d => d["Nhóm gộp"]
    );

    const totalDistinctOrdersByMonth = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"]
    );

    const totalOrdersByMonthObj = {};
    totalDistinctOrdersByMonth.forEach(([month, count]) => {
        totalOrdersByMonthObj[month] = count;
    });

    const data = [];

    groupByMonthGroup.forEach(([month, groups]) => {
        const totalInMonth = totalOrdersByMonthObj[month];

        groups.forEach(([groupName, groupCount]) => {
            const probability = groupCount / totalInMonth;

            data.push({
                month: +month,
                group: groupName,
                probability: probability
            });
        });
    });

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.month))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 0.7]) // Tùy chỉnh y-axis tối đa là 70%
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const dataGroup = d3.groups(data, d => d.group);

    const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.probability));

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(12).tickFormat(d => `Tháng ${d}`));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    svg.selectAll(".line")
        .data(dataGroup)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", d => color(d[0]))
        .attr("stroke-width", 2)
        .attr("d", d => line(d[1]));

    const legend = svg.selectAll(".legend")
        .data(dataGroup)
        .join("g")
        .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d[0]));

    legend.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .text(d => d[0]);

    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "8px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    svg.selectAll(".dot")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.month))
        .attr("cy", d => y(d.probability))
        .attr("r", 4)
        .attr("fill", d => color(d.group))
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>Tháng:</strong> ${d.month}<br/>
                <strong>Nhóm hàng:</strong> ${d.group}<br/>
                <strong>Xác suất:</strong> ${(d.probability * 100).toFixed(2)}%
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Thêm title vào SVG
    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .text("Xác suất bán hàng của Nhóm hàng theo Tháng");

}).catch(error => {
    console.error("Lỗi load dữ liệu:", error);
});