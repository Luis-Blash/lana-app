import { GastoFijo, IngresoFijo } from '@/domain/types'

export const seedIngresosFijos: Omit<IngresoFijo, 'id'>[] = [
  { nombre: 'Sueldo', monto: 15300, diaDelMes: 31 },
  { nombre: 'Bono', monto: 4000, diaDelMes: 4 },
]

export const seedGastosFijos: Omit<GastoFijo, 'id'>[] = [
  {
    nombre: 'HBO',
    montoMin: 149,
    montoMax: 149,
    frecuencia: 'mensual',
    diaDelMes: 10,
    diaSemana: null,
    cadaNMeses: null,
    mesAncla: null,
  },
  {
    nombre: 'Blink',
    montoMin: 60,
    montoMax: 60,
    frecuencia: 'mensual',
    diaDelMes: 12,
    diaSemana: null,
    cadaNMeses: null,
    mesAncla: null,
  },
  {
    nombre: 'YouTube',
    montoMin: 379,
    montoMax: 379,
    frecuencia: 'mensual',
    diaDelMes: 17,
    diaSemana: null,
    cadaNMeses: null,
    mesAncla: null,
  },
  {
    nombre: 'Totalplay',
    montoMin: 550,
    montoMax: 550,
    frecuencia: 'mensual',
    diaDelMes: 29,
    diaSemana: null,
    cadaNMeses: null,
    mesAncla: null,
  },
  {
    nombre: 'Despensa',
    montoMin: 300,
    montoMax: 480,
    frecuencia: 'semanal',
    diaDelMes: null,
    diaSemana: 5, // viernes
    cadaNMeses: null,
    mesAncla: null,
  },
  {
    nombre: 'Efectivo semanal',
    montoMin: 1800,
    montoMax: 1800,
    frecuencia: 'semanal',
    diaDelMes: null,
    diaSemana: 0, // domingo
    cadaNMeses: null,
    mesAncla: null,
  },
  {
    nombre: 'Croquetas',
    montoMin: 1810,
    montoMax: 1810,
    frecuencia: 'cada_n_meses',
    diaDelMes: null,
    diaSemana: null,
    cadaNMeses: 2,
    mesAncla: 1,
  },
]

export const seedReservaMontoDefault = 2500
