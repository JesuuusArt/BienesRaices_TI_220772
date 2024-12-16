import { Precio, Categoria, Propiedad, Usuario } from "../models/index.js"
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
                },
                {
                    model: Usuario,
                    as: 'usuario'
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
                },
                {
                    model: Usuario,
                    as: 'usuario'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        })
    ])

    const usuarioAdministrador = req.usuario
    res.render('inicio', {
        page: 'Inicio',
        usuarioAdministrador,
        categorias,
        precios,
        casas,
        departamentos,
        csrfToken: req.csrfToken()
    })
}

const categoria = async (req, res) => {
    const { id } = req.params
    //comprobar que la categoria exista 
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
            {model: Precio, as: 'precio'},
            {model: Usuario, as: 'usuario'}
        ]
    })
    const usuarioAdministrador = req.usuario
    res.render('categoria',{
        page: `${categoria.nombre}s en venta`,
        usuarioAdministrador,
        propiedades,
        csrfToken: req.csrfToken()
    })
}

const noEncontrado = (req, res) => {
    const usuarioAdministrador = req.usuario
    res.render('404',{
        page: 'No Encontrado',
        usuarioAdministrador,
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
            {model: Precio , as: 'precio'},
            {model: Usuario, as: 'usuario'}
        ]
    })
    
    const usuarioAdministrador = req.usuario
    res.render('busqueda',{
        page: 'Resultados de la busqueda',
        usuarioAdministrador,
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