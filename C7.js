d3.csv("data.csv").then(function(data) {
    const numOfUniqueOrders = new Set(data.map(d => d["Mã đơn hàng"])).size;

    const uniqueOrdersByCategory = d3.rollup(
        data,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
    );

    const salesProbabilityByCategory = Array.from(uniqueOrdersByCategory, ([category, count]) => ({
        category,
        probability: count / numOfUniqueOrders
    })).sort((a, b) => b.probability - a.probability);

    const width = 1300;
    const height = 600;
    const margin = { top: 50, right: 200, bottom: 50, left: 250 };

    const svg = d3.select("#chart7")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "50px")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, Math.max(0.5, d3.max(salesProbabilityByCategory, d => d.probability))])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(salesProbabilityByCategory.map(d => d.category))
        .range([0, height])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(salesProbabilityByCategory.map(d => d.category));

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

    svg.selectAll(".bar")
        .data(salesProbabilityByCategory)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.category))
        .attr("width", d => xScale(d.probability))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.category))
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
                    <strong>Nhóm hàng:</strong> ${d.category}<br>
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

    svg.selectAll(".label")
        .data(salesProbabilityByCategory)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => {
            const barWidth = xScale(d.probability);
            const labelWidthEstimate = d.probability.toString().length * 8 + 20;
            return barWidth >= labelWidthEstimate ? barWidth - 5 : barWidth + 5;
        })
        .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2 + 5)
        .attr("fill", d => {
            const barWidth = xScale(d.probability);
            const labelWidthEstimate = d.probability.toString().length * 8 + 20;
            return barWidth >= labelWidthEstimate ? "white" : "black";
        })
        .attr("font-size", "14px")
        .attr("text-anchor", "end")
        .text(d => `${(d.probability * 100).toFixed(2)}%`);

    const xAxis = d3.axisBottom(xScale)
        .tickValues(d3.range(0, xScale.domain()[1] + 0.1, 0.1))
        .tickFormat(d => `${(d * 100).toFixed(0)}%`);

    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "#ddd")
        .attr("stroke-dasharray", "4,4");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("font-size", "14px");

    svg.append("g")
        .call(yAxis)
        .selectAll("text")
        .attr("font-size", "14px");

    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .text("Xác suất bán hàng theo Nhóm hàng");
});