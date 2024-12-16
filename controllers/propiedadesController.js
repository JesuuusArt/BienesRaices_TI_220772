import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Mensaje, Usuario, Respuesta } from '../models/index.js'
import { unlink } from 'node:fs/promises'
import { esVendedor, formatearFecha } from '../helpers/index.js'


//? Vista del dueño de la cuenta
const admin = async (req, res) => {
    //! IMPORTANTE: Leer QueryString
    const { pagina: paginaActual } = req.query
    const expresion = /^[0-9]$/
    if (!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }
    try {
        const { id } = req.usuario
        // Limites y Dffset para el paginador
        const limit = 10
        const offset = ((paginaActual * limit) - limit)
        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioID: id
                },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes' }
                ],
            }),
            Propiedad.count({
                where: {
                    usuarioID: id
                }
            })
        ])
        res.render('propiedades/admin', {
            page: 'Mis Propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit,
        })
    } catch (error) {
        console.log(error)
    }
}

//? Formulario para crear una nueva propiedad
const crear = async (req, res) => {
    // Consultar Modelo de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/crear', {
        page: 'Crear propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

//? Guardar propiedad
const guardar = async (req, res) => {
    // Validacion
    let resultado = validationResult(req)
    if (!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        return res.render('propiedades/crear', {
            page: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    // Crear registro
    const renta = req.body.renta === 'on' ? 1 : 0;
    const venta = req.body.venta === 'on' ? 1 : 0;
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioID, categoria: categoriaID } = req.body
    const { id: usuarioID } = req.usuario
    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            renta,
            venta,
            calle,
            lat,
            lng,
            precioID,
            categoriaID,
            usuarioID,
            imagen: ''
        })
        const { id } = propiedadGuardada
        res.redirect(`/propiedades/agregar-imagen/${id}`)
    } catch (error) {
        console.log(error)
    }
}

//? Agregar imagen a propiedad
const agregarImagen = async (req, res) => {
    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedD NO ESTE PUBLICADA
    if (propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad  pertenece a quien visita esta pagina
    if (req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return res.redirect('/mis-propiedades')
    }
    return res.render('propiedades/agregar-imagen', {
        page: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
}

//? Guardar imagen
const almacenarImagen = async (req, res, next) => {
    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad NO ESTÉ PUBLICADA
    if (propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }
    // Validar que la propiedad pertenezca a quien visita esta página

    if (req.usuario.id.toString() !== propiedad.usuarioID.toString()) {
        return res.redirect('/mis-propiedades')
    }

    try {
        // Almacenar propiedad y publicarla
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1
        await propiedad.save();

        // Si todo es exitoso, pasar al siguiente middleware o función
        next();

    } catch (error) {
        console.log(error);
        // Manejar errores aquí
        // Puedes redirigir a una página de error o hacer algo más según tus necesidades
        res.redirect('/mis-propiedades');
    }
}

//? Actualizar propiedad
const editar = async (req, res) => {
    // Validaciones
    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Revisar quin visita la URL sea dueño de la propiedad
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    // Consultar el precio y categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/editar', {
        page: `Editar propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })
}

//? Actualizar propiedad
const guardarCambios = async (req, res) => {
    // Verificcar la Validacion
    let resultado = validationResult(req)
    if (!resultado.isEmpty()) {
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        return res.render('propiedades/editar', {
            page: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }
    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    // Rescribir el objeto y actualizar la bd
    try {
        const { titulo, descripcion, habitaciones, estacionamiento, wc, renta=false, venta=false, calle, lat, lng, precio: precioID, categoria: categoriaID } = req.body

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            renta,
            venta,
            calle,
            lat,
            lng,
            precioID,
            categoriaID
        })
        await propiedad.save();
        res.redirect('/mis-propiedades')
    } catch (error) {
        console.log(error)
    }
}

//? Eliminar propiedad
const eliminar = async (req, res) => {
    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    // Elminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`)
    console.log(`se elimino la imagen ${propiedad.imagen}`)
    // Eliminar la propiedad
    await propiedad.destroy()
    res.redirect('/mis-propiedades')
}

//? Modificar el estado de la propiedad
const cambiarEstado = async (req, res) => {
    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }
    // Revisar quin visita la URL sea dueño de la propeidd
    if (propiedad.usuarioID.toString() !== req.usuario.id.toString()) {
        return res.redirect('/mis-propiedades')
    }
    // Actualizar 
    propiedad.publicado = !propiedad.publicado
    await propiedad.save()
    res.json({
        resultado: 'true'
    })
}

//? Mostrar propiedad
const mostrarPropiedad = async (req, res) => {
    const { id } = req.params
    // Comprobar que la propieadad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
            { model: Usuario, as: 'usuario' }
        ]
    })
    if (!propiedad  || !propiedad.publicado) {
        return res.redirect('/404')
    }

    const usuarioAdministrador = req.usuario
    res.render('propiedades/mostrar', {
        usuarioAdministrador,
        propiedad,
        page: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID)
    })
}

//? Enviar mensajes
const enviarMensaje = async (req, res) => {
    const { id } = req.params
    // Comprobar que la propieadad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' },
            { model: Usuario, as: 'usuario' }
        ]
    })
    if (!propiedad) {
        return res.redirect('/404')
    }
    
    // Validacion
    let resultado = validationResult(req)
    const usuarioAdministrador = req.usuario
    if (!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            usuarioAdministrador,
            propiedad,
            page: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioID),
            errores: resultado.array()
        })
    }

    const { mensaje } = req.body
    const { id: propiedadID } = req.params
    const { id: usuarioID } = req.usuario

    //Almacenar el mensaje
    await Mensaje.create({
        mensaje,
        propiedadID,
        usuarioID
    })
    
    res.redirect('/')
}

//? Leer mensajes recibidos
const verMensajes = async (req, res) => {
    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {
                model: Mensaje, as: 'mensajes',
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario' },
                    { model: Respuesta, as: 'respuestas', include: [{ model: Usuario.scope('eliminarPassword'), as: 'usuario' }] }
                ]
            },
        ],
    })

    if (!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Verificar si el usuario tiene acceso
    const usuarioID = req.usuario.id;

    // Permitimos que los usuarios vean los mensajes que se han enviado a ellos o que ellos mismos enviaron
    const mensajesFiltrados = propiedad.mensajes.filter(mensaje => 
        mensaje.usuarioID === usuarioID || mensaje.propiedadID === propiedad.id
    );

    // Si el usuario no tiene ningún mensaje relacionado, redirigimos a la página de propiedades
    if (mensajesFiltrados.length === 0) {
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/mensajes', {
        page: 'Mensajes recibidos',
        csrfToken: req.csrfToken(),
        mensajes: mensajesFiltrados,
        formatearFecha
    })
}

//? Responder mensajes
const responderMensaje = async (req, res) => {
    const { id } = req.params
    const { respuesta } = req.body

    try {
        const mensaje = await Mensaje.findByPk(id, {
            include: [
                { model: Usuario.scope('eliminarPassword'), as: 'usuario' }
            ]
        })

        if (!mensaje) {
            return res.redirect('/mis-propiedades')
        }

        const propiedad = await Propiedad.findByPk(mensaje.propiedadID)
        
        // Validación para que solo el usuario propietario de la propiedad o el que ha enviado el mensaje pueda responder
        if (propiedad.usuarioID.toString() !== req.usuario.id.toString() && mensaje.usuarioID.toString() !== req.usuario.id.toString()) {
            return res.redirect('/mis-propiedades')
        }

        await Respuesta.create({
            respuesta,
            mensajeID: mensaje.id,
            usuarioID: req.usuario.id,
            propiedadID: propiedad.id
        })

        res.redirect(`/mensajes/${propiedad.id}`)
    } catch (error) {
        console.error(error)
        res.redirect('/mis-propiedades')
    }
}

//? Ver mis conversaciones
const obtenerConversaciones = async (req, res) => {
    const usuarioID = req.usuario.id;

    try {
        // Obtener mensajes enviados y recibidos por el usuario actual
        const mensajesEnviados = await Mensaje.findAll({
            where: { usuarioID },
            include: [
                { model: Propiedad, as: 'propiedade', include: [{ model: Usuario.scope('eliminarPassword'), as: 'usuario' }] },
                { model: Respuesta, as: 'respuestas', include: [{ model: Usuario.scope('eliminarPassword'), as: 'usuario' }] },
                { model: Usuario, as: 'usuario' }
            ]
        })

        const mensajesRecibidos = await Mensaje.findAll({
            include: [
                { model: Propiedad, as: 'propiedade', where: { usuarioID }, include: [{ model: Usuario.scope('eliminarPassword'), as: 'usuario' }] },
                { model: Usuario.scope('eliminarPassword'), as: 'usuario' },
                { model: Respuesta, as: 'respuestas', include: [{ model: Usuario.scope('eliminarPassword'), as: 'usuario' }] }
            ]
        })

        // Combinar los mensajes enviados y recibidos, eliminando duplicados
        const mensajes = [...mensajesEnviados, ...mensajesRecibidos].reduce((acc, mensaje) => {
            if (!acc.some(msg => msg.id === mensaje.id)) {
                acc.push(mensaje);
            }
            return acc
        }, [])

        res.render('propiedades/conversaciones', {
            page: 'Mis Conversaciones',
            csrfToken: req.csrfToken(),
            mensajes,
            formatearFecha
        });
    } catch (error) {
        console.error(error)
        res.redirect('/mis-propiedades')
    }
}

export {
    admin,
    crear,
    guardar,
    editar,
    agregarImagen,
    almacenarImagen,
    guardarCambios,
    eliminar,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes,
    cambiarEstado,
    responderMensaje,
    obtenerConversaciones
}

