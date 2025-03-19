d3.csv("data.csv").then(function(data) {
    const dataset1 = d3.rollups(
        data,
        v => d3.sum(v, d => +d["Thành tiền"]),
        d => d["Mã mặt hàng"],
        d => d["Tên mặt hàng"],
        d => d["Mã nhóm hàng"]
    ).map(([MaMatHang, values]) => {
        const [TenMatHang, groupValues] = values[0];
        const [MaNhomHang, ThanhTien] = groupValues[0];
        return {
            MaMatHang,
            TenMatHang,
            MaNhomHang,
            ThanhTien
        };
    }).sort((a, b) => b.ThanhTien - a.ThanhTien); 

    const width = 1300;
    const height = 600;
    const margin = { top: 50, right: 200, bottom: 50, left: 250 };

    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width + margin.left + margin.right) 
        .attr("height", height + margin.top + margin.bottom) 
        .style("font-family", "Arial, sans-serif") 
        .style("margin-bottom", "50px") 
        .append("g") 
        .attr("transform", `translate(${margin.left}, ${margin.top})`); 

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(dataset1, d => d.ThanhTien)])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(dataset1.map(d => `[${d.MaMatHang}] ${d.TenMatHang}`))
        .range([0, height])
        .padding(0.2); 

    const colorScale = d3.scaleOrdinal()
        .domain(dataset1.map(d => d.MaNhomHang))
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
        .data(dataset1)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => yScale(`[${d.MaMatHang}] ${d.TenMatHang}`))
        .attr("width", d => xScale(d.ThanhTien))
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.MaNhomHang)) 
        .attr("class", "bar")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
                    <strong>Mặt hàng:</strong> ${d.TenMatHang}<br>
                    <strong>Nhóm hàng:</strong> ${d.MaNhomHang}<br>
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
        .data(dataset1)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.ThanhTien) - 5) 
        .attr("y", d => yScale(`[${d.MaMatHang}] ${d.TenMatHang}`) + yScale.bandwidth() / 2 + 5)
        .attr("fill", "white") 
        .attr("font-weight", "bold")
        .attr("font-size", "9px") 
        .attr("text-anchor", "end")
        .text(d => `${(d.ThanhTien / 1e6).toFixed(0)} triệu VND`);

    const xTicks = d3.range(0, d3.max(dataset1, d => d.ThanhTien), 100000000);
    const xAxis = d3.axisBottom(xScale)
        .tickValues(xTicks)
        .tickFormat(d3.format(".2s"));

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(
            d3.axisBottom(xScale)
                .tickValues(xTicks)
                .tickSize(-height) 
                .tickFormat("")
        )
        .selectAll("line")
        .attr("stroke", "#ddd")  
        .attr("stroke-dasharray", "4,4"); 

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);


    svg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("font-size", "10px");  

    const legend = svg.selectAll(".legend")
        .data(colorScale.domain())
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width + 10)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorScale);

    legend.append("text")
        .attr("x", width + 35)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);

    svg.append("text")
        .attr("class", "title")
        .attr("x", width / 2) 
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px") 
        .text("Doanh số bán hàng theo Mặt hàng");

});