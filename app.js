// 1. Configurações de tamanho do mapa
const width = 1000;
const height = 600;

const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

// Projeção do mapa mundi
const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.4]);

const path = d3.geoPath().projection(projection);

// 2. Dados de ataques DDoS
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

const attackMap = new Map(ddosData.map(d => [d.id, d]));

// 3. Escalas de Cores e Tamanhos
const colorScale = d3.scaleQuantize()
    .domain([0, 2500])
    .range(["#1e293b", "#3730a3", "#6b21a8", "#991b1b", "#7f1d1d"]);

const radiusScale = d3.scaleSqrt()
    .domain([0, 2500])
    .range([0, 35]);

// Usando uma URL alternativa de GeoJSON altamente estável e compatível
const geoJsonUrl = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

// 4. Carregar o mapa GeoJSON e desenhar
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
            // Esse GeoJSON usa d.id direto (ex: "BRA", "USA")
            const countryId = d.id;
            const data = attackMap.get(countryId);
            return data ? colorScale(data.attacks) : "#1e293b"; 
        })
        .on("mouseover", (event, d) => {
            const countryId = d.id;
            const data = attackMap.get(countryId);
            
            const nomePais = data ? data.name : (d.properties?.name || "Desconhecido");
            const totalAtaques = data ? data.attacks : 0;

            // Mostra o tooltip usando a opacidade/display do próprio D3 de forma segura
            d3.select("#tooltip")
                .style("display", "block")
                .style("opacity", 1)
                .style("left", (event.offsetX + 15) + "px")
                .style("top", (event.offsetY + 15) + "px");
            
            d3.select("#country-name").text(nomePais);
            d3.select("#attack-count").text(totalAtaques);
            d3.select("#risk-level").text(data ? obtenerNivelRisco(data.attacks) : "Baixo");
        })
        .on("mousemove", (event) => {
            d3.select("#tooltip")
               .style("left", (event.offsetX + 15) + "px")
               .style("top", (event.offsetY + 15) + "px");
        })
        .on("mouseleave", () => {
            d3.select("#tooltip").style("display", "none");
        });

    // 5. Desenhar os Círculos de Ataques
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

function obtenerNivelRisco(ataques) {
    if (ataques > 1500) return "Crítico 🔴";
    if (ataques > 800) return "Alto 🟠";
    return "Médio 🟡";
}
