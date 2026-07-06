// 1. Configurações de tamanho do mapa e container SVG
const width = 1000;
const height = 600;

const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

// Projeção Mercator bem ajustada para centralizar o mundo
const projection = d3.geoMercator()
    .scale(145)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

// 2. Dados de ataques DDoS com IDs Numéricos Oficiais (ISO 3166-1 Numeric)
// Isso impede divergências de chaves entre o arquivo e o código.
const ddosData = [
    { id: "840", name: "Estados Unidos", attacks: 1540, coordinates: [-100, 40] }, // USA
    { id: "156", name: "China", attacks: 2300, coordinates: [105, 35] },          // CHN
    { id: "076", name: "Brasil", attacks: 850, coordinates: [-55, -10] },          // BRA
    { id: "643", name: "Rússia", attacks: 1900, coordinates: [100, 60] },          // RUS
    { id: "276", name: "Alemanha", attacks: 450, coordinates: [10, 51] },          // DEU
    { id: "356", name: "Índia", attacks: 720, coordinates: [78, 21] },            // IND
    { id: "826", name: "Reino Unido", attacks: 380, coordinates: [-2, 55] },       // GBR
    { id: "710", name: "África do Sul", attacks: 210, coordinates: [24, -29] }     // ZAF
];

// Criando o mapa de busca rápida por ID numérico
const attackMap = new Map(ddosData.map(d => [d.id, d]));

// Escala Threshold: Valores bem distribuídos para uma paleta de alerta
const colorScale = d3.scaleThreshold()
    .domain([200, 500, 1000, 1800])
    .range(["#2e1065", "#5b21b6", "#7c3aed", "#dc2626", "#991b1b"]);

const radiusScale = d3.scaleSqrt()
    .domain([0, 2500])
    .range([0, 35]);

// 3. Link Oficial do TopoJSON/GeoJSON do ecossistema do D3 (110m de resolução, super leve)
const geoJsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Carregando os dados e a extensão TopoJSON para converter em GeoJSON nativo
Promise.all([
    d3.json(geoJsonUrl),
    d3.script("https://unpkg.com/topojson-client@3") // Garante a dependência de conversão em tempo de execução
]).then(([topoData]) => {
    
    // Converte os dados do formato compacto TopoJSON para GeoJSON reconhecido pelo D3
    const geoData = topojson.feature(topoData, topoData.objects.countries);

    // CAMADA 1: Desenhar a malha de países
    svg.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            // d.id aqui puxa o código numérico padrão (ex: "076" para o Brasil)
            const countryId = String(d.id).padStart(3, '0'); 
            const data = attackMap.get(countryId);
            
            // Pinta se tiver ataque mapeado, caso contrário usa o cinza/azul de fundo
            return (data && data.attacks > 0) ? colorScale(data.attacks) : "#1e293b"; 
        })
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

    // CAMADA 2: Círculos de Ataques (por CIMA com pointer-events desativado)
    svg.append("g")
        .selectAll("circle")
        .data(ddosData)
        .enter()
        .append("circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", d => radiusScale(d.attacks))
        .attr("fill", "#00f2fe")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "#00f2fe")
        .attr("stroke-width", 1.5)
        .style("pointer-events", "none"); // Essencial para o mouse passar direto para o país

}).catch(error => {
    console.error("Erro na renderização do D3:", error);
});

function obterNivelRisco(ataques) {
    if (ataques > 1500) return "Crítico 🔴";
    if (ataques > 800) return "Alto 🟠";
    return "Médio 🟡";
}
