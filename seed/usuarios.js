import bcrypt from 'bcrypt'
const usuarios = [
    {
        nombre: 'Jesus',
        email: 'jesus@gmail.com',
        birthDate: '2003-11-04',
        confirmado: '1',
        password: bcrypt.hashSync('password', 10)
    }
]

export default usuarios