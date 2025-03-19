d3.csv("data.csv").then(function(data) {
    const spendingByCustomer = d3.rollup(
        data,
        v => d3.sum(v, d => +d["Thành tiền"]),
        d => d["Mã khách hàng"]
    );

    const spendingArray = Array.from(spendingByCustomer, ([customer, spending]) => ({
        customer,
        spending
    }));

    const step = 50000;
    const maxSpending = d3.max(spendingArray, d => d.spending);
    const numBins = Math.ceil(maxSpending / step);
    const spendingCategories = Array.from({ length: numBins + 1 }, (_, i) => ({
        range: `${i * 50}k`,
        min: i * step,
        max: (i + 1) * step
    }));
    spendingCategories.push({
        range: `Trên ${(numBins * 50)}k`,
        min: numBins * step,
        max: Infinity
    });

    const spendingDistribution = spendingCategories.map(category => ({
        range: category.range,
        count: spendingArray.filter(d => d.spending >= category.min && d.spending < category.max).length
    }));

    const width = 1300;
    const height = 600;
    const margin = { top: 50, right: 200, bottom: 50, left: 250 };

    const svg = d3.select("#chart12")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif")
        .style("margin-bottom", "50px")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(spendingDistribution.map(d => d.range))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(spendingDistribution, d => d.count) * 1.1])
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

    svg.selectAll(".bar")
        .data(spendingDistribution)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.range))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.count))
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
                    <strong>Mức chi tiêu:</strong> ${d.range}<br>
                    <strong>Số lượng khách hàng:</strong> ${d.count}
                `);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

    const xAxis = d3.axisBottom(xScale);

    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "grid")
        .call(
            d3.axisLeft(yScale)
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
        .attr("font-size", "10px")
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "end")
        .attr("dy", "-0.5em")
        .attr("dx", "-0.5em");

    svg.append("g")
        .call(yAxis)
        .selectAll("text")
        .attr("font-size", "10px");

    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .text("Phân phối mức chi tiêu của khách hàng");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 90)
        .attr("text-anchor", "middle")
        .text("Mức chi tiêu của khách hàng");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", -height / 2)
        .attr("y", -70)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Số lượng khách hàng");
});