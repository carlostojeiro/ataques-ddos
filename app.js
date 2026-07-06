// 1. Configurações de tamanho do mapa e container SVG
const width = 1000;
const height = 600;

const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

const mainGroup = svg.append("g");

// Configuração do Zoom e Pan (Rolagem do mouse e arrastar)
const zoomBehavior = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
    });

svg.call(zoomBehavior);

// Projeção Mercator para centralizar o mundo
const projection = d3.geoMercator()
    .scale(145)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);


// Armazenados localmente para garantir o deploy seguro e rápido no GitHub Pages
// 2. Dados Consolidados de Telemetria de Ameaças - TOP 20 GLOBAL
// Armazenados localmente com IDs Oficiais ISO 3166-1 Numéricos
const ddosData = [
    { id: "156", name: "China", attacks: 84100 },
    { id: "840", name: "Estados Unidos", attacks: 52400 },
    { id: "643", name: "Rússia", attacks: 48900 },
    { id: "356", name: "Índia", attacks: 32700 },
    { id: "704", name: "Vietnã", attacks: 28400 },
    { id: "076", name: "Brasil", attacks: 24500 },
    { id: "410", name: "Coreia do Sul", attacks: 21200 },
    { id: "276", name: "Alemanha", attacks: 14500 },
    { id: "826", name: "Reino Unido", attacks: 13300 },
    { id: "158", name: "Taiwan", attacks: 12100 },
    { id: "702", name: "Singapura", attacks: 11800 },
    { id: "392", name: "Japão", attacks: 10500 },
    { id: "250", name: "França", attacks: 9800 },
    { id: "528", name: "Países Baixos", attacks: 9200 },
    { id: "710", name: "África do Sul", attacks: 8210 },
    { id: "764", name: "Tailândia", attacks: 7900 },
    { id: "170", name: "Colômbia", attacks: 7100 },
    { id: "792", name: "Turquia", attacks: 6800 },
    { id: "380", name: "Itália", attacks: 6200 },
    { id: "484", name: "México", attacks: 5900 }
];

const attackMap = new Map(ddosData.map(d => [d.id, d]));

// Escala Threshold ajustada para os volumes consolidados
const colorScale = d3.scaleThreshold()
    .domain([10000, 30000, 50000, 80000])
    .range(["#4c1d95", "#6d28d9", "#7c3aed", "#dc2626", "#b91c1c"]);

const radiusScale = d3.scaleSqrt()
    .domain([0, 90000])
    .range([2, 38]);

// 3. Link Oficial e Seguro do Atlas do D3 (JSON estático permitido pelo GitHub)
const geoJsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

d3.json(geoJsonUrl).then(topoData => {
    
    // Converte o TopoJSON usando a biblioteca estática do cabeçalho HTML
    const geoData = topojson.feature(topoData, topoData.objects.countries);

    // CAMADA 1: Desenhar o Mapa Mundi (Países)
    mainGroup.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            const countryId = String(d.id).padStart(3, '0'); 
            const data = attackMap.get(countryId);
            return (data && data.attacks > 0) ? colorScale(data.attacks) : "#334155"; 
        })
        .attr("stroke", "#1e293b") 
        .attr("stroke-width", "0.5px")
        .on("mouseover", (event, d) => {
            const countryId = String(d.id).padStart(3, '0');
            const data = attackMap.get(countryId);
            
            const nomePais = data ? data.name : d.properties.name;
            const totalAtaques = data ? data.attacks : 0;

            d3.select("#tooltip")
               .style("display", "block")
               .style("left", (event.offsetX + 15) + "px")
               .style("top", (event.offsetY + 15) + "px");
            
            d3.select("#country-name").text(nomePais);
            d3.select("#attack-count").text(totalAtaques.toLocaleString());
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

    // CAMADA 2: Círculos de Ataque Proporcionais (Calculados dinamicamente sobre o centro de cada país)
    mainGroup.append("g")
        .selectAll("circle")
        .data(geoData.features)
        .enter()
        .append("circle")
        .filter(d => {
            const countryId = String(d.id).padStart(3, '0');
            return attackMap.has(countryId);
        })
        .attr("cx", d => path.centroid(d)[0]) // Centro geométrico perfeito gerado pelo D3
        .attr("cy", d => path.centroid(d)[1])
        .attr("r", d => {
            const countryId = String(d.id).padStart(3, '0');
            const data = attackMap.get(countryId);
            return radiusScale(data.attacks);
        })
        .attr("fill", "#00f2fe")
        .attr("fill-opacity", 0.55) 
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .style("pointer-events", "none"); 

}).catch(error => {
    console.error("Erro na renderização do mapa estático:", error);
});

function obterNivelRisco(ataques) {
    if (ataques > 50000) return "Crítico 🔴";
    if (ataques > 30000) return "Alto 🟠";
    return "Médio 🟡";
}
