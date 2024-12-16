import bcrypt from 'bcrypt'
const usuarios = [ {
        nombre: 'Jesus',
        email: 'jesus@gmail.com',
        birthDate: '2003-04-11',
        confirmado: 1,
        password: bcrypt.hashSync('password', 10),
        image: 'default.jpg'
    }
]

export default usuarios