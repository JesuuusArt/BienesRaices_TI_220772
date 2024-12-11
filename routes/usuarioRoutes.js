import express from "express";
import { formularioLogin, formularioRegistro, registrar, confirmar, formularioOlvidePassword, resetPassword, comprobarToken, nuevoPassword, autenticar, cerrarSesion } from "../controllers/usuarioController.js";

const router = express.Router();
//Routing
router.get('/login', formularioLogin);
router.post('/login', autenticar);

//cerrar sesión 

router.post('/cerrar-sesion', cerrarSesion)

router.get('/registro', formularioRegistro);
router.post('/registro', registrar);

router.get('/confirmar/:token', confirmar)

router.get('/olvide-password', formularioOlvidePassword);
router.post('/olvide-password', resetPassword);

//Almacena el nuevo password
router.get('/olvide-password/:token', comprobarToken);
router.post('/olvide-password/:token', nuevoPassword);



export default router