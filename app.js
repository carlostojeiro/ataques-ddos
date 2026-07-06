// 1. Configurações de tamanho do mapa e container SVG
const width = 1000;
const height = 600;

const svg = d3.select("#map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%");

const mainGroup = svg.append("g");

// Configuração do Zoom e Pan
const zoomBehavior = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
    });

svg.call(zoomBehavior);

// Projeção Mercator
const projection = d3.geoMercator()
    .scale(145)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

// Escalas dinâmicas (Ajustadas para o volume de relatórios do DShield)
// O DShield reporta "número de IPs atacantes/relatórios únicos" por país
const colorScale = d3.scaleThreshold()
    .domain([1000, 5000, 20000, 50000])
    .range(["#2e1065", "#5b21b6", "#7c3aed", "#dc2626", "#b91c1c"]);

const radiusScale = d3.scaleSqrt()
    .domain([0, 100000])
    .range([2, 40]); // Círculos proporcionais ao volume real

// URLs das APIs (Fundo Geográfico + Feed de Ameaças Reais)
const geoJsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
// API do DShield que traz o Top 50 países geradores de incidentes/ataques nas últimas horas
const threatApiUrl = "https://isc.sans.edu/api/topcountries/50?json";

// 2. Carregar os dados geográficos e os dados da API em paralelo
Promise.all([
    d3.json(geoJsonUrl),
    d3.json(threatApiUrl)
]).then(([topoData, threatData]) => {
    
    // Converte o TopoJSON do Atlas para GeoJSON nativo
    const geoData = topojson.feature(topoData, topoData.objects.countries);

    // Dicionário para converter a sigla Alpha-2 da API (ex: "BR") para o ID Numérico do D3 (ex: "076")
    // O DShield responde com código de 2 letras (ISO Alpha-2), precisamos mapear para cruzar os dados
    const threatMap = new Map();
    
    // Processa os dados vindos da API do DShield
    threatData.forEach(item => {
        // A API deles retorna: country (código), count (relatórios), name (nome do país)
        // Guardamos usando o nome ou código para fazer o cruzamento cartográfico
        threatMap.set(item.country.toUpperCase(), {
            attacks: parseInt(item.count),
            name: item.name
        });
    });

    // Função auxiliar para cruzar os dados usando as propriedades do World Atlas
    // O objeto 'd.properties.name' do Atlas costuma bater com o 'item.name' do SANS
    function obterDadosAmeaça(d) {
        const nomePaisIngles = d.properties.name;
        // Busca no mapa de ameaças pelo nome em inglês enviado pela API
        for (let [codigo, info] of threatMap.entries()) {
            if (info.name.toLowerCase() === nomePaisIngles.toLowerCase()) {
                return info;
            }
        }
        return null;
    }

    // CAMADA 1: Desenhar o Mapa Mundi
    mainGroup.append("g")
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .attr("fill", d => {
            const info = obterDadosAmeaça(d);
            return (info && info.attacks > 0) ? colorScale(info.attacks) : "#334155"; 
        })
        .attr("stroke", "#1e293b") 
        .attr("stroke-width", "0.5px")
        .on("mouseover", (event, d) => {
            const info = obterDadosAmeaça(d);
            
            const nomePais = info ? info.name : d.properties.name;
            const totalAtaques = info ? info.attacks : 0;

            d3.select("#tooltip")
               .style("display", "block")
               .style("left", (event.offsetX + 15) + "px")
               .style("top", (event.offsetY + 15) + "px");
            
            d3.select("#country-name").text(nomePais);
            d3.select("#attack-count").text(totalAtaques.toLocaleString()); // Formata número com pontos
            d3.select("#risk-level").text(info ? obterNivelRisco(info.attacks) : "Baixo 🟢");
        })
        .on("mousemove", (event) => {
            d3.select("#tooltip")
               .style("left", (event.offsetX + 15) + "px")
               .style("top", (event.offsetY + 15) + "px");
        })
        .on("mouseleave", () => {
            d3.select("#tooltip").style("display", "none");
        });

    // CAMADA 2: Desenhar os Círculos com base nos dados REAIS da API
    // Para desenhar os círculos, precisamos calcular as coordenadas (centro) de cada país do mapa
    mainGroup.append("g")
        .selectAll("circle")
        .data(geoData.features.filter(d => obterDadosAmeaça(d) !== null))
        .enter()
        .append("circle")
        .attr("cx", d => path.centroid(d)[0]) // Calcula o centro geométrico exato do país no mapa
        .attr("cy", d => path.centroid(d)[1])
        .attr("r", d => {
            const info = obterDadosAmeaça(d);
            return radiusScale(info.attacks);
        })
        .attr("fill", "#00f2fe")
        .attr("fill-opacity", 0.5) 
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .style("pointer-events", "none"); 

}).catch(error => {
    console.error("Erro ao consumir API de ameaças ou mapa:", error);
});

// Ajuste dos limites de risco para a escala real da API do SANS Institute
function obterNivelRisco(ataques) {
    if (ataques > 20000) return "Crítico 🔴";
    if (ataques > 5000) return "Alto 🟠";
    return "Médio 🟡";
}
