import { DataTypes } from 'sequelize'
import db from '../config/db.js'
import Mensaje from './Mensaje.js'
import Propiedad from './Propiedad.js'
import Usuario from './Usuario.js'

const Respuesta = db.define('respuestas', {
    respuesta: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    mensajeID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Mensaje,
            key: 'id'
        }
    },
    usuarioID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,
            key: 'id'
        }
    },
    propiedadID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        references: {
            model: Propiedad,
            key: 'id'
        }
    }
})

export default Respuesta
