// 1. Configurações de tamanho do mapa
const width = 1000;
const height = 600;

const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

const projection = d3.geoMercator()
    .scale(140)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

// 2. Dados de ataques DDoS com IDs normatizados em MAIÚSCULO
const ddosData = [
    { id: "USA", name: "Estados Unidos", attacks: 1540, coordinates: [-100, 40] },
    { id: "CHN", name: "China", attacks: 2300, coordinates: [105, 35] },
    { id: "BRA", name: "Brasil", attacks: 850, coordinates: [-55, -10] },
    { id: "RUS", name: "Rússia", attacks: 1900, coordinates: [100, 60] },
    { id: "DEU", name: "Alemanha", attacks: 450, coordinates: [10, 51] },
    { id: "IND", name: "Índia", attacks: 720, coordinates: [78, 21] },
    { id: "GBR", name: "Reino Unido", attacks: 380, coordinates: [-2, 55] },
    { id: "ZAF", name: "África do Sul", attacks: 210, coordinates: [24, -29] }
];

// Força o mapa a guardar as chaves sempre em letras maiúsculas para evitar falhas de busca
const attackMap = new Map(ddosData.map(d => [d.id.toUpperCase(), d]));

// Escala de cores para os países com ataques
const colorScale = d3.scaleThreshold()
    .domain([200, 500, 1000, 1800])
    .range(["#2e1065", "#5b21b6", "#7c3aed", "#dc2626", "#991b1b"]);

const radiusScale = d3.scaleSqrt()
    .domain([0, 2500])
    .range([0, 35]);

// 3. Carregar o GeoJSON
const geoJsonUrl = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

d3.json(geoJsonUrl).then(geoData => {
    
    // CAMADA 1: Desenhar os Países primeiro (Fundo)
    svg.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            // Garante a busca usando ID em maiúsculo
            const countryId = d.id ? d.id.toUpperCase() : "";
            const data = attackMap.get(countryId);
            
            if (data && data.attacks > 0) {
                return colorScale(data.attacks);
            }
            return "#1e293b"; // Cinza/Azul padrão para TODOS os outros países
        })
        .on("mouseover", (event, d) => {
            const countryId = d.id ? d.id.toUpperCase() : "";
            const data = attackMap.get(countryId);
            
            const nomePais = data ? data.name : d.properties.name;
            const totalAtaques = data ? data.attacks : 0;

            d3.select("#tooltip")
               .style("display", "block")
               .style("left", (event.offsetX + 15) + "px")
               .style("top", (event.offsetY + 15) + "px");
            
            d3.select("#country-name").text(nomePais);
            d3.select("#attack-count").text(totalAtaques);
            d3.select("#risk-level").text(data ? obterNivelRisco(data.attacks) : "Baixo 🟢");
        })
        .on("mousemove", (event) => {
            d3.select("#tooltip")
               .style("left", (event.offsetX + 15) + "px")
               .style("top", (event.offsetY + 15) + "px");
        })
        .on("mouseleave", () => {
            d3.select("#tooltip").style("none");
        });

    // CAMADA 2: Desenhar os Círculos por CIMA dos países
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
        .attr("fill-opacity", 0.7) // Transparência interna do círculo para ver o mapa atrás dele
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .style("pointer-events", "none"); // DIRETAMENTE NO ELEMENTO: Força o mouse a ignorar o círculo

}).catch(error => {
    console.error("Erro ao carregar o mapa:", error);
});

function obterNivelRisco(ataques) {
    if (ataques > 1500) return "Crítico 🔴";
    if (ataques > 800) return "Alto 🟠";
    return "Médio 🟡";
}
