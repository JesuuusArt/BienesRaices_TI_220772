import Jwt from 'jsonwebtoken'

const generarJWT = datos => Jwt.sign({ id: datos.id, nombre: datos.nombre }, process.env.JWT_SECRET, { expiresIn: '1d' })

const generateID = () => Math.random().toString(32).substring(2) + Date.now().toString(32);

export { generateID, generarJWT }