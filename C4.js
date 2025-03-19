d3.csv("data.csv").then(function(data) {
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const formatDay = d3.timeFormat("%u");
    const daysOfWeek = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

    const salesByDay = d3.rollups(
        data,
        v => ({
            total: d3.sum(v, d => +d["Thành tiền"]),
            count: d3.rollup(v, d => d.length, d => d3.timeFormat("%V")(parseDate(d["Thời gian tạo đơn"]))).size
        }),
        d => formatDay(parseDate(d["Thời gian tạo đơn"]))
    ).map(([day, { total, count }]) => ({
        day: +day,
        average: total / count
    })).sort((a, b) => a.day - b.day);

    const width = 1300;
    const height = 600;
    const margin = { top: 70, right: 200, bottom: 50, left: 250 };

    const svg = d3.select("#chart4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "50px")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(daysOfWeek)
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(salesByDay, d => d.average) * 1.1])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(daysOfWeek)
        .range(d3.schemeTableau10);

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
        .attr("x", d => xScale(daysOfWeek[d.day - 1]))
        .attr("y", d => yScale(d.average))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.average))
        .attr("fill", d => colorScale(daysOfWeek[d.day - 1]))
        .attr("class", "bar")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
                    <strong>Ngày trong tuần:</strong> ${daysOfWeek[d.day - 1]}<br>
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
        .attr("x", d => xScale(daysOfWeek[d.day - 1]) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.average) + 15)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .text(d => `${d.average.toLocaleString()} VND`);

    const xAxis = d3.axisBottom(xScale);

    const yTicks = [0, 5000000, 10000000, 15000000];
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
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .text("Doanh số bán hàng trung bình theo Ngày trong tuần");

});