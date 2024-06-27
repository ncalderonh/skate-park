module.exports = {
    estadoClass: (estado) => estado ? 'text-success font-weight-bold' : 'text-warning font-weight-bold',
    estadoTexto: (estado) => estado ? 'Aprobado' : 'En revisión',
};