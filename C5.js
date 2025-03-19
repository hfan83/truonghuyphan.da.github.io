d3.csv("data.csv").then(function(data) {
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const formatDay = d3.timeFormat("%d");
    const daysInMonth = Array.from({ length: 31 }, (_, i) => `Ngày ${String(i + 1).padStart(2, '0')}`);

    data.forEach(d => {
        d["Ngày trong tháng"] = `Ngày ${String(parseDate(d["Thời gian tạo đơn"]).getDate()).padStart(2, '0')}`;
    });

    const salesByDay = d3.rollups(
        data,
        v => ({
            total: d3.sum(v, d => +d["Thành tiền"]),
            count: d3.rollup(v, d => d.length, d => d3.timeFormat("%m")(parseDate(d["Thời gian tạo đơn"]))).size
        }),
        d => d["Ngày trong tháng"]
    ).map(([day, { total, count }]) => ({
        day,
        average: total / count
    })).sort((a, b) => daysInMonth.indexOf(a.day) - daysInMonth.indexOf(b.day));

    const width = 1300;
    const height = 600;
    const margin = { top: 50, right: 200, bottom: 50, left: 250 };

    const svg = d3.select("#chart5")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "50px")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(daysInMonth)
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(salesByDay, d => d.average) * 1.1])
        .range([height, 0]);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "7px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 0px 10px rgba(0, 0, 0, 0.1)")
        .style("font-size", "13px")
        .style("display", "none");

    svg.selectAll("rect")
        .data(salesByDay)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.day))
        .attr("y", d => yScale(d.average))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.average))
        .attr("fill", "steelblue")
        .attr("class", "bar")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
                    <strong>Ngày trong tháng:</strong> ${d.day}<br>
                    <strong>Doanh số bán TB:</strong> ${d.average.toLocaleString()} VND
                `);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

    svg.selectAll(".label")
        .data(salesByDay)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.day) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.average) + 15)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .text(d => `${(d.average / 1e6).toFixed(1)}M`);

    const xAxis = d3.axisBottom(xScale);

    const yTicks = d3.range(0, d3.max(salesByDay, d => d.average) * 1.1, 5000000);
    const yAxis = d3.axisLeft(yScale)
        .tickValues(yTicks)
        .tickFormat(d => `${d / 1e6}M`);

    svg.append("g")
        .attr("class", "grid")
        .call(
            d3.axisLeft(yScale)
                .tickValues(yTicks)
                .tickSize(-width)
                .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "#ddd")
        .attr("stroke-dasharray", "4,4");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");

    svg.append("g")
        .call(yAxis);

    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .text("Doanh số bán hàng trung bình theo Ngày trong tháng");
});