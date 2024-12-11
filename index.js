import express from 'express'
import csurf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'

//crear la app
const app = express()

//habilitar lectura de datos de formularios

app.use(express.urlencoded({ extend: true }))

//Habilitar cookie Parser
app.use(cookieParser())

//habilitar csurf
app.use(csurf({ cookie: true }))

//conexion a la bd
try {
    await db.authenticate();
    db.sync()
    console.log('Conexion a la bd exitosa!!!')
} catch (error) {
    console.log(error)
}


//habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta publica
app.use(express.static('public'))


//roting
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)

//definir un puerto y arrancar el proyecto
const port = 3000;
app.listen(port, () => {
    console.log(`El servidor esta funcionando en el puerto ${port}`)
});