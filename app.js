// 1. Configurações de tamanho do mapa e container SVG
const width = 1000;
const height = 600;

const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

// NOVIDADE: Criamos um grupo principal que vai conter TODAS as camadas do mapa.
// É esse grupo que receberá o efeito de zoom e arrastar simultaneamente.
const mainGroup = svg.append("g");

// CONFIGURAÇÃO DO ZOOM: Ativa o botão de rolagem do mouse e o clique-e-arraste
const zoomBehavior = d3.zoom()
    .scaleExtent([1, 8]) // Define o zoom mínimo (1x) e máximo (8x)
    .on("zoom", (event) => {
        // Aplica a transformação geométrica (translação e escala) ao grupo principal
        mainGroup.attr("transform", event.transform);
    });

// Vincula o comportamento de zoom diretamente ao container SVG principal
svg.call(zoomBehavior);

// Projeção Mercator
const projection = d3.geoMercator()
    .scale(145)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

// 2. Dados de ataques DDoS com IDs Numéricos Oficiais
const ddosData = [
    { id: "840", name: "Estados Unidos", attacks: 1540, coordinates: [-100, 40] },
    { id: "156", name: "China", attacks: 2300, coordinates: [105, 35] },
    { id: "076", name: "Brasil", attacks: 850, coordinates: [-55, -10] },
    { id: "643", name: "Rússia", attacks: 1900, coordinates: [100, 60] },
    { id: "276", name: "Alemanha", attacks: 450, coordinates: [10, 51] },
    { id: "356", name: "Índia", attacks: 720, coordinates: [78, 21] },
    { id: "826", name: "Reino Unido", attacks: 380, coordinates: [-2, 55] },
    { id: "710", name: "África do Sul", attacks: 210, coordinates: [24, -29] }
];

const attackMap = new Map(ddosData.map(d => [d.id, d]));

// Escala Threshold para os países afetados
const colorScale = d3.scaleThreshold()
    .domain([200, 500, 1000, 1800])
    .range(["#4c1d95", "#6d28d9", "#7c3aed", "#dc2626", "#b91c1c"]);

const radiusScale = d3.scaleSqrt()
    .domain([0, 2500])
    .range([0, 35]);

// 3. Link do Atlas do D3
const geoJsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

d3.json(geoJsonUrl).then(topoData => {
    
    const geoData = topojson.feature(topoData, topoData.objects.countries);

    // ATENÇÃO: Agora anexamos as camadas dentro do 'mainGroup', e não direto no 'svg'
    
    // CAMADA 1: Desenhar a malha de países
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

    // CAMADA 2: Círculos de Ataques por CIMA (também dentro do mainGroup)
    mainGroup.append("g")
        .selectAll("circle")
        .data(ddosData)
        .enter()
        .append("circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", d => radiusScale(d.attacks))
        .attr("fill", "#00f2fe")
        .attr("fill-opacity", 0.6) 
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .style("pointer-events", "none"); 

}).catch(error => {
    console.error("Erro na renderização do D3:", error);
});

function obterNivelRisco(ataques) {
    if (ataques > 1500) return "Crítico 🔴";
    if (ataques > 800) return "Alto 🟠";
    return "Médio 🟡";
}
