d3.csv("data.csv").then(function(data) {
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    const dataset3 = d3.rollups(
        data,
        v => d3.sum(v, d => +d["Thành tiền"]),
        d => d3.timeFormat("%m")(parseDate(d["Thời gian tạo đơn"]))
    ).map(([Thang, ThanhTien]) => ({
        Thang,
        ThanhTien
    })).sort((a, b) => a.Thang - b.Thang);

    const width = 1300;
    const height = 600;
    const margin = { top: 70, right: 200, bottom: 50, left: 250 };

    const svg = d3.select("#chart3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "50px")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(dataset3.map(d => `Tháng ${d.Thang}`))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset3, d => d.ThanhTien)])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(dataset3.map(d => d.Thang))
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
        .data(dataset3)
        .enter()
        .append("rect")
        .attr("x", d => xScale(`Tháng ${d.Thang}`))
        .attr("y", d => yScale(d.ThanhTien))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.ThanhTien))
        .attr("fill", d => colorScale(d.Thang))
        .attr("class", "bar")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
                    <strong>Tháng:</strong> ${d.Thang}<br>
                    <strong>Doanh số bán:</strong> ${d.ThanhTien.toLocaleString()} VND
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
        .data(dataset3)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(`Tháng ${d.Thang}`) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.ThanhTien) + 15)
        .attr("fill", "white")
        .attr("font-weight", "bold")
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .text(d => `${(d.ThanhTien / 1e6).toFixed(0)} triệu VND`);

    const xAxis = d3.axisBottom(xScale);

    const yTicks = [0, 200000000, 400000000, 600000000, 800000000];
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
        .text("Doanh số bán hàng theo Tháng");

    svg.selectAll(".domain").attr("stroke", "none");
});