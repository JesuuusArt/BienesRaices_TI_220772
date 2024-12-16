import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const { email, nombre, token } = datos

  //Enviar el email
  await transport.sendMail({
    from: 'BienesRaices.com',
    to: email,
    subject: 'Confirma tu cuenta en BienesRaices',
    text: 'Confirma tu cuenta en BienesRaices',
    html: `
            <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu Cuenta en Bienes Raíces</title>
</head>
<body style="background-color: #ffffff; color: #000000; font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; position: relative;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #faf5f0; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); position: relative;">

        <div style="position: absolute; top: 10px; right: 10px;">
            <img src="cid:logoBR" alt="Logo Bienes Raíces" style="width: 50px; height: auto; border-radius: 5px;">
        </div>

        <h1 style="color: #ee7956; text-align: center; font-size: 24px; font-weight: bold; margin: 0 0 20px;">
            ¡Bienvenido a Bienes Raíces!
        </h1>

        <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:casa" alt="Bienvenido" style="max-width: 100px; height: auto;">
        </div>

        <p style="color: #636363; margin: 10px 0;">
            ¡Hola, <strong>${nombre}</strong>! Qué gusto verte por aquí.
        </p>

        <p style="color: #636363; margin: 10px 0;">
            Tu cuenta ya está casi lista. Solo debes confirmarla haciendo clic en el siguiente enlace:
        </p>

        <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirm/${token}" 
                style="background-color: #ee7956; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; display: inline-block;">
                Confirmar Cuenta
            </a>
        </div>

        <p style="color: #636363; margin: 10px 0;">
            Una vez confirmes tu cuenta, podrás acceder a todos nuestros servicios y explorar las mejores opciones de bienes raíces. ¡Estamos emocionados de tenerte con nosotros!
        </p>

        <p style="color: #636363; margin: 10px 0;">
            Si no creaste esta cuenta, puedes ignorar este mensaje. ¡No te preocupes, nada sucederá!
        </p>

        <div style="margin-top: 20px; text-align: right; font-size: 14px; font-style: italic; color: #636363;">
            <p>Atentamente,</p>
            <img src="cid:firma" alt="Firma del equipo de Bienes Raíces" style="width: 150px; height: auto; margin-top: 10px;">
            <p><strong>El equipo de Bienes Raíces</strong></p>
        </div>

        <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #636363;">
            &copy; 2024 BienesRaices.com - Todos los derechos reservados. 
            <br>
            <a href="#politicas" style="color: #636363;">Políticas de Privacidad</a> | <a href="#terminos" style="color: #636363;">Términos de Servicio</a>
        </footer>

    </div>
</body>
</html>

    `,
    attachments: [
        {
            filename: 'logo_BR.png', 
            path: './public/assets/logo_BR.png', 
            cid: 'logoBR' 
        },
        {
            filename: 'firma.png', 
            path: './public/assets/firma.png', 
            cid: 'firma'
        },
        {
            filename: 'casa.png', 
            path: './public/assets/casa.png', 
            cid: 'casa'
        }
    ]
  })
}

const emailOlvidePassword = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const { email, nombre, token } = datos

  //Enviar el email
  await transport.sendMail({
    from: 'BienesRaices.com',
    to: email,
    subject: 'Restablece tu password en BienesRaices.com',
    text: 'Restablece tu password en BienesRaices.com',
    html: `
            <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recupera tu contraseña</title>
</head>
<body style="background-color: #ffffff; color: #000000; font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; position: relative;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #faf5f0; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); position: relative;">
        <div style="position: absolute; top: 10px; right: 10px;">
            <img src="cid:logoBR" alt="Logo Bienes Raíces" style="width: 50px; height: auto; border-radius: 5px;">
        </div>
        <h1 style="color: #ee7956; text-align: center; font-size: 24px; font-weight: bold; margin: 0 0 20px;">
            Bienvenido a Bienes Raíces
        </h1>
        <p style="color: #636363; margin: 10px 0;">
            Hola <strong>${nombre}</strong>,
        </p>
        <p style="color: #636363; margin: 10px 0;">
            Si quieres reestablecer tu contraseña en Bienes Raices. Solo debes hacer clic en el siguiente enlace:
        </p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}" 
                style="background-color: #ee7956; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; display: inline-block;">
                Recuperar Contraseña
            </a>
        </div>
        <p style="color: #636363; margin: 10px 0;">
            Si no solicitaste el cambio de contraseña, puedes ignorar este mensaje.
        </p>
        <div style="margin-top: 20px; text-align: right; font-size: 14px; font-style: italic; color: #636363;">
            <p>Atentamente,</p>
            <img src="cid:firma" alt="Firma del equipo de Bienes Raíces" style="width: 150px; height: auto; margin-top: 10px;">
            <p><strong>El equipo de Bienes Raíces</strong></p>
        </div>
        <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #636363;">
            &copy; 2024 BienesRaices.com - Todos los derechos reservados
        </footer>
    </div>
</body>
</html>
    `,
    attachments: [
        {
            filename: 'logo_BR.png', 
            path: './public/assets/logo_BR.png', 
            cid: 'logoBR' 
        },
        {
            filename: 'firma.png', 
            path: './public/assets/firma.png', 
            cid: 'firma'
        },
        {
            filename: 'casa.png', 
            path: './public/assets/casa.png', 
            cid: 'casa'
        }
    ]
  })

}

export { emailRegistro, emailOlvidePassword }