// ... (mantenha a parte inicial do seu app.js idêntica)

d3.json(geoJsonUrl).then(geoData => {
    
    // Desenhar os países
    svg.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            // Ajuste aqui: Testa ISO_A3 ou o id da propriedade raiz do feature
            const countryId = d.properties.ISO_A3 || d.id;
            const data = attackMap.get(countryId);
            return data ? colorScale(data.attacks) : "#1e293b"; 
        })
        .on("mouseover", (event, d) => {
            const countryId = d.properties.ISO_A3 || d.id;
            const data = attackMap.get(countryId);
            
            // Exibir o nome correto vindo do GeoJSON se não houver mapeamento
            const nomePais = data ? data.name : (d.properties.ADMIN || d.properties.NAME || "Desconhecido");
            const totalAtaques = data ? data.attacks : 0;

            const tooltip = d3.select("#tooltip");
            tooltip.style("display", "block")
                   .style("left", (event.offsetX + 15) + "px")
                   .style("top", (event.offsetY + 15) + "px");
            
            // Atualiza os textos internos do Tooltip
            d3.select("#country-name").text(nomePais);
            d3.select("#attack-count").text(totalAtaques);
            d3.select("#risk-level").text(data ? obterNivelRisco(data.attacks) : "Baixo");
        })
        .on("mousemove", (event) => {
            d3.select("#tooltip")
               .style("left", (event.offsetX + 15) + "px")
               .style("top", (event.offsetY + 15) + "px");
        })
        .on("mouseleave", () => {
            d3.select("#tooltip").style("display", "none");
        });

    // Desenhar os Círculos (pode manter como estava)
    svg.append("g")
        .selectAll("circle")
        .data(ddosData)
        .enter()
        .append("circle")
        .attr("class", "attack-circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", d => radiusScale(d.attacks))
        .attr("fill", "#00f2fe")
        .attr("style", "mix-blend-mode: screen;");

}).catch(error => {
    console.error("Erro ao carregar o GeoJSON:", error);
});

// ... (mantenha a função obterNivelRisco abaixo)
