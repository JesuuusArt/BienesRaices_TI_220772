(function () {

    const lat = document.querySelector('#lat').value || 20.67444163271174;
    const lng = document.querySelector('#lng').value || -103.38739216304566;
    const mapa = L.map('mapa').setView([lat, lng], 16);
    let marker;

    //utilizar provider y geocoder

    const geocodeService = L.esri.Geocoding.geocodeService();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    //El pin
    marker = new L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    })
        .addTo(mapa)

    //Detectar el movimiento del pin
    marker.on('moveend', function (e) {
        marker = e.target

        const posicion = marker.getLatLng();

        mapa.panTo(new L.LatLng(posicion.lat, posicion.lng))

        //obtener informacion de las calles al soltar el pin

        geocodeService.reverse().latlng(posicion, 13).run(function (error, resultado) {
            marker.bindPopup(resultado.address.LongLabel)

            //llenar los campos
            document.querySelector('.calle').textContent = resultado?.address?.Address ?? '';
            document.querySelector('#calle').value = resultado?.address?.Address ?? '';
            document.querySelector('#lat').value = resultado?.latlng?.lat ?? '';
            document.querySelector('#lng').value = resultado?.latlng?.lng ?? '';
        })

    })
})()