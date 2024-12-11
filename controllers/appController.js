import { Precio, Categoria, Propiedad } from "../models/index.js"
import { Sequelize } from 'sequelize'

const inicio = async (req, res) => {

    const [categorias, precios, casas, departamentos] = await Promise.all([
        Categoria.findAll({ raw: true }),
        Precio.findAll({ raw: true }),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaID: 1
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaID: 2
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        })
    ])

    res.render('inicio', {
        pagina: 'Inicio',
        categorias,
        precios,
        casas,
        departamentos,
        csrfToken: req.csrfToken()
    })
}

const categoria = async (req, res) => {

    const { id } = req.params

    //comprobar que la cateoria exista 

    const categoria = await Categoria.findByPk(id)

    if (!categoria) {
        return res.redirect('/404')
    }

    //obtener propiedades de la categoria

    const propiedades = await Propiedad.findAll({
        where: {
            categoriaID: id
        },
        include: [
            {model: Precio, as: 'precio'}
        ]
    })

    res.render('categoria',{
        pagina: `${categoria.nombre}s en venta`,
        propiedades,
        csrfToken: req.csrfToken()
    })
}

const noEncontrado = (req, res) => {
    res.render('404',{
        pagina: 'No Encontrado',
        csrfToken: req.csrfToken()
    })
}

const buscador = async (req, res) => {
    const {termino} = req.body

    //validar que termino no este vacio

    if(!termino.trim()){
        return res.redirect('back')
    }

    //consultar las propiedades

    const propiedades = await Propiedad.findAll({
        where: {
            titulo: {
                [Sequelize.Op.like] : '%' + termino + '%'
            }
        },
        include: [
            {model: Precio , as: 'precio'}
        ]
    })

    res.render('busqueda',{
        pagina: 'Resultados de la busqueda',
        propiedades,
        csrfToken: req.csrfToken()
    })
}

export {
    inicio,
    categoria,
    noEncontrado,
    buscador
}