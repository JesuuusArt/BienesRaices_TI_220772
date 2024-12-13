import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generateID, generarJWT } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req, res) => {
    //validación
    await check('email').isEmail().withMessage('El email es obligatorio').run(req)
    await check('password').notEmpty().withMessage('El password es obligatorio').run(req)

    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        })
    }


    const { email, password } = req.body
    //comprobar si el usuario existe
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no existe' }]
        })
    }

    //comprobar si el usuario esta confirmado
    if (!usuario.confirmado) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'Tu cuenta no ha sido confirmada' }]
        })
    }

    //Revisar el password
    if (!usuario.verificarPassword(password)) {
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El password es incorrecto' }]
        })
    }

    //Autenticar al usuario
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });

    console.log(token);

    //Almacenar en un cookie

    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true
    }).redirect('/mis-propiedades')

}

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}


const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req, res) => {
    console.log(req.body)
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacío').run(req);
    await check('email')
        .notEmpty().withMessage('El correo electrónico es un campo obligatorio')
        .isEmail().withMessage('El correo electrónico no tiene el formato correcto')
        .run(req);
    await check('password')
        .notEmpty().withMessage('La contraseña es un campo obligatorio')
        .isLength({ min: 8 }).withMessage('El Password debe ser de al menos 8 caracteres')
        .run(req);
    await check('repetir_password')
        .equals(req.body.password).withMessage('La contraseña debe coincidir con la anterior')
        .run(req);

    // Validación de la fecha de nacimiento
    await check('birthDate')
    .isISO8601()
    .withMessage('La fecha debe tener un formato válido (AAAA-MM-DD).')
    .custom((birthDate) => {
        const fecha = new Date(birthDate)
        const hoy = new Date()

        // Verifica que la fecha no sea futura
        if (fecha > hoy) {
            throw new Error('La fecha de nacimiento no puede ser en el futuro.')
        }

        // Verifica que el usuario tenga al menos 18 años
        const edadMinima = 18
        const anios = hoy.getFullYear() - fecha.getFullYear()
        const mes = hoy.getMonth() - fecha.getMonth()
        const dia = hoy.getDate() - fecha.getDate()

        if (anios < edadMinima || (anios === edadMinima && (mes < 0 || (mes === 0 && dia < 0)))) {
            throw new Error('Debes tener al menos 18 años.')
        }
        return true
    }).run(req)


    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
                birthDate: req.body.birthDate
            }
        })
    }

    //Extraer los datos
    const { nombre, email, password, foto = '', birthDate } = req.body

    //verificar que el usuario no este duplicado
    const existeUsuario = await Usuario.findOne({ where: { email } })
    if (existeUsuario) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario ya está registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
                birthDate: req.body.birthDate
            }
        })
    }

    //Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        foto,
        birthDate: birthDate,
        token: generateID()
    })

    //Enviar email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    res.render('auth/agregar-foto', {
        pagina: `Agregar Imagen: ${usuario.nombre}`,
        csrfToken: req.csrfToken(),
        usuario
    })
}

const subirFotoPerfil = async (req, res) => {

    const { id } = req.params

    const usuario = await Usuario.findByPk(id)

    if (!usuario) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no esta Registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

        //Enviar email de confirmacion
        emailRegistro({
            nombre: usuario.nombre,
            email: usuario.email,
            token: usuario.token
        })
    
}

const almacenarFotoPerfil = async (req, res) => {
    const { id } = req.params;

    // Validar que el usuario exista
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El usuario no está registrado' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            },
        });
    }

    try {
        console.log(req.file);

        // Almacenar la imagen del usuario
        usuario.foto = req.file.filename;
        await usuario.save();

        // Enviar el correo de confirmación
        emailRegistro({
            nombre: usuario.nombre,
            email: usuario.email,
            token: usuario.token,
        });

        // Mostrar la página de mensaje de confirmación
        return res.render('templates/message', {
            pagina: 'Cuenta creada correctamente',
            mensaje: 'Hemos enviado un email de confirmación, presiona en el enlace.',
            csrfToken: req.csrfToken(),
        });
    } catch (error) {
        console.log(error);

        // Manejar errores en la subida de la imagen
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'La subida de la imagen falló, intenta de nuevo.' }],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            },
        });
    }
};

//Funcion que comprueba una cuenta
const confirmar = async (req, res) => {
    const { token } = req.params;

    //verificar si el token es valido

    const usuario = await Usuario.findOne({ where: { token } })
    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }

    //confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmo correctamente'
    })


    console.log(usuario)
}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raíces',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req, res) => {
    //validación
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)

    let resultado = validationResult(req)
    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raíces',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //Buscar al usuario
    const { email } = req.body
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raíces',
            csrfToken: req.csrfToken(),
            errores: [{ msg: 'El email no pertenece a ningún usuario' }]
        })
    }

    //Generar un token y enviar el email
    usuario.token = generateID();
    await usuario.save();

    //Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    //Renderizar un mensaje
    res.render('templates/message', {
        pagina: 'Restablece tu password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    })

}

const comprobarToken = async (req, res) => {
    const { token } = req.params;
    const usuario = await Usuario.findOne({ where: { token } })
    if (!usuario) {
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Restablece tu password',
            mensaje: 'Hubo un error al validar tu informsción, intenta de nuevo',
            error: true
        })
    }

    //mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Restablece tu password',
        csrfToken: req.csrfToken()
    })

}

const nuevoPassword = async (req, res) => {
    //validar el password
    await check('password').isLength({ min: 6 }).withMessage('El password debe ser de almenos 6 caracteres').run(req)

    let resultado = validationResult(req)

    //verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        return res.render('auth/reset-password', {
            pagina: 'Restablece tu password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const { token } = req.params
    const { password } = req.body;

    //identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: { token } })

    //hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Restablecido',
        mensaje: 'El password se guardo correctamente'
    })


}

export {
    formularioLogin,
    cerrarSesion,
    formularioRegistro,
    almacenarFotoPerfil,
    subirFotoPerfil,
    autenticar,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}