import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generateID, generarJWT } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

//? Vista del login
const formularioLogin = (req, res) => {
    res.render('auth/login', {
        page: 'Iniciar Sesión',
        bg_reg: true,
        csrfToken: req.csrfToken()
    })
}

//? Autenticación del login
const autenticar = async (req, res) => {
    // Validación
    await check('email').isEmail().withMessage('El email es obligatorio').run(req)
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/login', {
            page: 'Iniciar Sesión',
            bg_reg: true,
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        })
    }

    const { email, password } = req.body
    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        return res.render('auth/login', {
            page: 'Iniciar Sesión',
            bg_reg: true,
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no existe' }]
        })
    }

    // Comprobar si el usuario esta confirmado
    if (!usuario.confirmado) {
        return res.render('auth/login', {
            page: 'Iniciar Sesión',
            bg_reg: true,
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu cuenta no ha sido confirmada' }]
        })
    }

    // Revisar el password
    if (!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            page: 'Iniciar Sesión',
            bg_reg: true,
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El password es incorrecto' }]
        })
    }

    // Autenticar al usuario
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre })
    // Almacenar en un cookie
    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true
    }).redirect('/mis-propiedades')
}

//? Cerrar la sesion
const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}

//? Vista del registro
const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        page: 'Crear cuenta',
        csrfToken: req.csrfToken()
    })
}

//? Registrar una cuenta nueva
const registrar = async (req, res) => {
    // Validación
    let d = new Date()
    let year = d.getFullYear()
    let month = d.getMonth()
    let day = d.getDate()
    let cA = new Date(year - 18, month, day).toDateString()
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio').run(req)
    await check('email').notEmpty().withMessage('El correo electronico es un campo obligatorio').isEmail().withMessage('El correo electronico no tiene el formato correcto').run(req)
    await check('birthDate').notEmpty().withMessage('La fecha de nacimiento es obligatoria').isBefore(cA).withMessage('No cumples con la mayoria de edad').run(req)
    await check('password').notEmpty().withMessage('La contraseña es un campo obligatorio').isLength({ min: 8 }).withMessage('La contraseña debe ser de al menos 8 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Las contraseñas no coinciden').run(req)

    let resultado = validationResult(req)

    // Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/registro', {
            page: 'Crear Cuenta',
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
                birthDate: req.body.birthDate
            },
            csrfToken: req.csrfToken()
        })
    }

    // Extraer los datos
    const { nombre, email, birthDate, password } = req.body

    // Verificar que el usuario no este duplicado
    const existeUsuario = await Usuario.findOne({ where: { email } })
    
    if (existeUsuario) {
        return res.render('auth/registro', {
            page: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El Usuario ya esta Registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    // Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        birthDate,
        password,
        token: generateID()
    })

    // Enviar email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    // Renderizar la vista de agregar imagen
    res.render('auth/agregar-imagen', {
        csrfToken: req.csrfToken(),
        usuarioId: usuario.id
    });
}

//? Procesar una imagen de perfil
const agregarFotoPerfil = async (req, res, next) => {
    const { usuarioId } = req.body;
    try {
        const usuario = await Usuario.findByPk(usuarioId);

        if (req.file) {
            usuario.image = req.file.filename;
        } else {
            usuario.image = 'default.jpg';
        }

        await usuario.save();

        res.redirect(`/mensaje?usuarioId=${usuarioId}`);
    } catch (error) {
        console.log(error);
    }
}

//? Funcion que comprueba una cuenta
const confirmar = async (req, res) => {
    const { token } = req.params;

    //verificar si el token es valido

    const usuario = await Usuario.findOne({ where: { token } })
    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            page: 'Error al Confirmar tu Cuenta',
            msg: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    //confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        page: 'Cuenta confirmada',
        msg: 'La Cuenta se Confirmo Correctamente'
    })


    console.log(usuario)
}

//? Formulario olvide password
const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        page: 'Recuperar contraseña',
        csrfToken: req.csrfToken()
    })
}

//? Resetear password
const resetPassword = async (req, res) => {
    //validación
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)

    let resultado = validationResult(req)
    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/olvide-password', {
            page: 'Recuperar contraseña',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //Buscar al usuario
    const { email } = req.body
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        return res.render('auth/olvide-password', {
            page: 'Recuperar contraseña',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El email no pertenece a ningún usuario' }]
        })
    }

    // Generar un token y enviar el email
    usuario.token = generateID();
    await usuario.save();

    // Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    // Renderizar un mensaje
    res.render('templates/message', {
        page: 'Restablece tu password',
        msg: email
    })

}

//? Verificar token
const comprobarToken = async (req, res) => {
    const { token } = req.params;
    const usuario = await Usuario.findOne({ where: { token } })
    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            page: 'Restablece tu password',
            msg: 'Hubo un error al validar tu información, intentalo de nuevo',
            error: true
        })
    }

    // Mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        page: 'Restablece tu password',
        csrfToken: req.csrfToken()
    })

}

//? Cambiar password
const nuevoPassword = async (req, res) => {
    // Validar el password
    await check('password').isLength({ min: 8 }).withMessage('El password debe contener al menos 8 caracteres').run(req)
    await check('confirm_password').equals(req.body.password).withMessage('Las contrasenas no coinciden').run(req)
    let resultado = validationResult(req)

    // Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/reset-password', {
            page: 'Restablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const { token } = req.params
    const { password } = req.body;

    // Identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: { token } })

    // Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null
    await usuario.save()

    res.render('auth/confirmar-cuenta', {
        page: 'Contraseña restablecida',
        msg: 'El password se guardo correctamente'
    })
}

//? Ver mi perfil
const verPerfil = async (req, res) => {
    res.render('propiedades/perfil', {
        page: 'Mi Perfil',
        csrfToken: req.csrfToken()
    })
}


export {
    formularioLogin,
    cerrarSesion,
    formularioRegistro,
    autenticar,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword,
    agregarFotoPerfil,
    verPerfil
}