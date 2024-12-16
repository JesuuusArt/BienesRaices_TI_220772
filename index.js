import express from 'express'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'

//? Crear la app
const app = express()

//? Habilitar lectura de datos de formularios

app.use(express.urlencoded({ extend: true }))

//? Habilitar cookie Parser
app.use(cookieParser())

//? Habilitar csurf
app.use(csurf({ cookie: true }))

//? Conexion a la bd
try {
    await db.authenticate();
    db.sync()
    console.log('Conexión exitosa a la bd')
} catch (error) {
    console.log(error)
}

//? Habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

//? Carpeta publica
app.use(express.static('public'))
app.use(express.static('assets'))


//? Routing
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)

//? Definir un puerto y arrancar el proyecto
const port = 3000;
app.listen(port, () => {
    console.log(`El servidor se esta ejecutando en el puerto ${port}`)
});