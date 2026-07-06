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
    .scale(140)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

// 2. Dados de ataques DDoS
const ddosData = [
    { id: "USA", name: "Estados Unidos", attacks: 1540, coordinates: [-100, 40] },
    { id: "CHN", name: "China", attacks: 2300, coordinates: [105, 35] },
    { id: "BRA", name: "Brasil", attacks: 850, coordinates: [-55, -10] },
    { id: "RUS", name: "Rússia", attacks: 1900, coordinates: [100, 60] },
    { id: "DEU", name: "Alemanha", attacks: 450, coordinates: [10, 51] },
    { id: "IND", name: "Índia", attacks: 720, coordinates: [78, 21] },
    { id: "GBR", name: "Reino Unido", attacks: 380, coordinates: [-2, 55] }, // Coordenada ajustada
    { id: "ZAF", name: "África do Sul", attacks: 210, coordinates: [24, -29] },
    { id: "FRA", name: "França", attacks: 0, coordinates: [2, 46] } // Coordenada ajustada
];

const attackMap = new Map(ddosData.map(d => [d.id, d]));

// Escalas
const colorScale = d3.scaleThreshold()
    .domain([200, 500, 1000, 1800])
    .range(["#2e1065", "#5b21b6", "#7c3aed", "#dc2626", "#991b1b"]);

const radiusScale = d3.scaleSqrt()
    .domain([0, 2500])
    .range([0, 35]);

// 3. Carregar o GeoJSON funcional
const geoJsonUrl = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

d3.json(geoJsonUrl).then(geoData => {
    
    // NOVIDADE: Criar grupos para gerenciar a ordem de empilhamento (Z-index)
    // Os círculos ficam no grupo de trás, os países no grupo da frente.
    const backGroup = svg.append("g").attr("id", "back-layer");
    const frontGroup = svg.append("g").attr("id", "front-layer");

    // PASSOS INVERTIDOS:

    // --- Passo A: Desenhar os Círculos (NO GRUPO DE TRÁS) ---
    backGroup.selectAll("circle")
        .data(ddosData.filter(d => d.attacks > 0)) // Desenha apenas se houver ataques
        .enter()
        .append("circle")
        .attr("class", "attack-circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", d => radiusScale(d.attacks))
        .attr("fill", "#00f2fe"); // Ciano sólido
        // mix-blend-mode e opacity foram removidos daqui

    // --- Passo B: Desenhar os Países (NO GRUPO DA FRENTE) ---
    frontGroup.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            const countryId = d.id;
            const data = attackMap.get(countryId);
            
            // Lógica condicional de preenchimento para as cores neutras
            if (data && data.attacks > 0) {
                return colorScale(data.attacks);
            } else {
                return "#1e293b"; // Neutro visível
            }
        })
        .on("mouseover", (event, d) => {
            const countryId = d.id;
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
            d3.select("#tooltip").style("display", "none");
        });

}).catch(error => {
    console.error("Erro ao carregar o mapa:", error);
});

function obterNivelRisco(ataques) {
    if (ataques > 1500) return "Crítico 🔴";
    if (ataques > 800) return "Alto 🟠";
    return "Médio 🟡";
}
