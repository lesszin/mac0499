const map = L.map('mapContainer', { zoomControl: false }).setView([-23.55052, -46.633308], 13);
L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

const markerClusterGroup = L.markerClusterGroup({
    disableClusteringAtZoom: 14
});
map.addLayer(markerClusterGroup);

const redIcon = L.divIcon({
    className: 'marker-no-bg',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="28" height="40" style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));"><path fill="#dc3545" d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/></svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40] 
});

function loadSchoolsOnMap() {
    const bounds = map.getBounds();
    const lat_min = bounds.getSouth();
    const lat_max = bounds.getNorth();
    const lng_min = bounds.getWest();
    const lng_max = bounds.getEast();

    const checkboxes = document.querySelectorAll('.modality-filter:checked');
    const modalities = Array.from(checkboxes).map(cb => cb.value).join(',');

    fetch(`/api/escolas-mapa?lat_min=${lat_min}&lat_max=${lat_max}&lng_min=${lng_min}&lng_max=${lng_max}&modalidades=${modalities}`)
        .then(response => response.json())
        .then(schools => {
            markerClusterGroup.clearLayers();

            schools.forEach(school => {
                const marker = L.marker([school.lat, school.lng], { icon: redIcon });
                
                marker.bindPopup(`
                    <strong>${school.nome}</strong><br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="window.open('/escola/${school.codigo}', '_blank')">
                        Ver Detalhes
                    </button>
                `);
                
                markerClusterGroup.addLayer(marker);
            });
        })
        .catch(error => console.error(error));
}

map.on('moveend', loadSchoolsOnMap);

document.querySelectorAll('.modality-filter').forEach(checkbox => {
    checkbox.addEventListener('change', loadSchoolsOnMap);
});

loadSchoolsOnMap();

const searchInput = document.getElementById('schoolInput');
const suggestionsBox = document.getElementById('searchSuggestions');

searchInput.addEventListener('input', function() {
    const term = this.value.trim();
    
    if (term.length < 3) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.add('d-none');
        return;
    }

    fetch(`/api/busca/${term}`)
        .then(response => response.json())
        .then(schools => {
            suggestionsBox.innerHTML = '';
            
            if (schools.length === 0) {
                suggestionsBox.innerHTML = '<div class="list-group-item text-muted">Nenhuma escola encontrada</div>';
                suggestionsBox.classList.remove('d-none');
                return;
            }

            schools.forEach(school => {
                const button = document.createElement('button');
                button.className = 'list-group-item list-group-item-action text-start py-2';
                button.innerHTML = `
                    <div class="fw-bold text-dark">${school.nome}</div>
                    <small class="text-muted">${school.cidade} - ${school.estado}</small>
                `;
                
                button.onclick = () => {
                    suggestionsBox.classList.add('d-none');
                    searchInput.value = ''; 
                    
                    map.flyTo([school.lat, school.lng], 16);
                    
                    setTimeout(() => {
                        L.popup({ offset: [0, -32] })
                            .setLatLng([school.lat, school.lng])
                            .setContent(`
                                <strong>${school.nome}</strong><br>
                                <button class="btn btn-sm btn-primary mt-2" onclick="window.open('/escola/${school.codigo}', '_blank')">
                                    Ver Detalhes
                                </button>
                            `)
                            .openOn(map);
                    }, 500);
                };
                
                suggestionsBox.appendChild(button);
            });
            
            suggestionsBox.classList.remove('d-none');
        })
        .catch(error => console.error(error));
});

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('d-none');
    }
});