import Propiedad from './Propiedad.js'
import Precio from './Precio.js'
import Categoria from './Categoria.js'
import Usuario from './Usuario.js'
import Mensaje from './Mensaje.js'
import Respuesta from './Respuesta.js'

Propiedad.belongsTo(Precio, { foreignKey: 'precioID' })
Propiedad.belongsTo(Categoria, { foreignKey: 'categoriaID' })
Propiedad.hasMany(Mensaje, { foreignKey: 'propiedadID' })
Propiedad.belongsTo(Usuario, { foreignKey: 'usuarioID' })
Usuario.hasMany(Propiedad, { foreignKey: 'usuarioID' })

Mensaje.belongsTo(Propiedad, { foreignKey: 'propiedadID' })
Mensaje.belongsTo(Usuario, { foreignKey: 'usuarioID' })
Mensaje.hasMany(Respuesta, { foreignKey: 'mensajeID' })

Respuesta.belongsTo(Mensaje, { foreignKey: 'mensajeID' })
Respuesta.belongsTo(Usuario, { foreignKey: 'usuarioID' })
Respuesta.belongsTo(Propiedad, { foreignKey: 'propiedadID' })

Propiedad.hasMany(Respuesta, { foreignKey: 'propiedadID' })
Usuario.hasMany(Respuesta, { foreignKey: 'usuarioID' })

export {
    Propiedad,
    Precio,
    Categoria,
    Usuario,
    Mensaje,
    Respuesta
}