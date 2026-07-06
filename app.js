// 1. Configurações de tamanho do mapa
const width = 1000;
const height = 600;

const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

// Projeção do mapa mundi (Mercator é ótima para visualizações planas)
const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.4]);

const path = d3.geoPath().projection(projection);

// 2. Dados fictícios de ataques DDoS (Substitua pelos seus dados reais se quiser)
// Os IDs devem bater com o padrão ISO Alpha-3 do GeoJSON (ex: BRA = Brasil, USA = EUA)
const ddosData = [
    { id: "USA", name: "Estados Unidos", attacks: 1540, coordinates: [-100, 40] },
    { id: "CHN", name: "China", attacks: 2300, coordinates: [105, 35] },
    { id: "BRA", name: "Brasil", attacks: 850, coordinates: [-55, -10] },
    { id: "RUS", name: "Rússia", attacks: 1900, coordinates: [100, 60] },
    { id: "DEU", name: "Alemanha", attacks: 450, coordinates: [10, 51] },
    { id: "IND", name: "Índia", attacks: 720, coordinates: [78, 21] },
    { id: "GBR", name: "Reino Unido", attacks: 380, coordinates: [-2, 54] },
    { id: "ZAF", name: "África do Sul", attacks: 210, coordinates: [24, -29] }
];

// Transforma os dados em um mapa de busca rápida por ID do país
const attackMap = new Map(ddosData.map(d => [d.id, d]));

// 3. Escalas de Cores (Países) e Tamanhos (Círculos)
// Países com mais ataques tendem ao vermelho escuro, menos ataques ao azul/cinza
const colorScale = d3.scaleQuantize()
    .domain([0, 2500])
    .range(["#1e293b", "#3730a3", "#6b21a8", "#991b1b", "#7f1d1d"]);

// Escala para o raio dos círculos (Ataques maiores = Círculos maiores)
const radiusScale = d3.scaleSqrt()
    .domain([0, 2500])
    .range([0, 35]); // Raio mínimo 0px, máximo 35px

// 4. Carregar o mapa GeoJSON e desenhar a tela
const geoJsonUrl = "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

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
            // Verifica se o país tem dados de ataque, se não, usa a cor padrão
            const countryId = d.properties.ISO_A3;
            const data = attackMap.get(countryId);
            return data ? colorScale(data.attacks) : "#1e293b"; 
        })
        .on("mouseover", (event, d) => {
            const countryId = d.properties.ISO_A3;
            const data = attackMap.get(countryId);
            
            // Atualizar e mostrar o Tooltip
            const tooltip = d3.select("#tooltip");
            tooltip.classList?.remove("hidden"); // garante compatibilidade
            tooltip.style("display", "block")
                   .style("left", (event.offsetX + 15) + "px")
                   .style("top", (event.offsetY + 15) + "px");
            
            d3.select("#country-name").text(d.properties.ADMIN);
            d3.select("#attack-count").text(data ? data.attacks : "0");
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

    // 5. Desenhar os Círculos de Ataques por cima
    svg.append("g")
        .selectAll("circle")
        .data(ddosData)
        .enter()
        .append("circle")
        .attr("class", "attack-circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", d => radiusScale(d.attacks))
        .attr("fill", "#00f2fe") // Cor ciano brilhante para os círculos destacarem
        .attr("style", "mix-blend-mode: screen;"); // Efeito visual de brilho

}).catch(error => {
    console.error("Erro ao carregar o GeoJSON:", error);
});

// Função auxiliar para o Tooltip
function obterNivelRisco(ataques) {
    if (ataques > 1500) return "Crítico 🔴";
    if (ataques > 800) return "Alto 🟠";
    return "Médio 🟡";
}