import { Dropzone } from 'dropzone'
const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
Dropzone.options.fotoperfil = {
    dictDefaultMessage: 'Sube tu foto de perfil aqui',
    acceptedFiles: '.png, .jpg, .jpeg',
    maxFilesize: 5,
    maxFiles: 1,
    parallelUploads: 1,
    autoProcessQueue: false,
    addRemoveLinks: true,
    dictRemoveFile: 'Borrar Archivo',
    dictMaxFilesExceeded: 'El Limite es un Archivo',
    headers: {
        'CSRF-Token': token
    },
    paramName: 'fotoperfil',

    init: function () {
        const dropzone = this
        const btnPublicar = document.querySelector('#subir-continuar')

        btnPublicar.addEventListener('click', function () {
            dropzone.processQueue()
        })

        dropzone.on('queuecomplete', function(){
            if(dropzone.getActiveFiles().length == 0){
                const usuarioId = document.querySelector('input[name="usuarioId"]').value
                window.location.href = `/auth/mensaje?usuarioId=${usuarioId}`
            }
        })
    }
}