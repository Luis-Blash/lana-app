# lana

App móvil personal de finanzas (Expo, React Native). Todo local, sin backend, sin nube — vive en
tu teléfono.

## De qué va

El objetivo es uno solo: saber en cualquier momento **cuánto puedes gastar o comprometer sin
quedarte sin liquidez**, incluyendo simular compras a meses sin intereses (MSI) antes de hacerlas.

- **Inicio**: el "disponible real" del mes, grande y arriba, con una proyección de los próximos 6
  meses coloreada (verde/rojo) y la lista de movimientos del mes (editables).
- **Simular**: metes un precio y un plazo (1/3/6/12 meses) y ves al instante la mensualidad y si
  algún mes futuro queda en rojo, antes de comprar.
- **Ingresos** / **Gastos**: tus ingresos y gastos fijos (mensuales, semanales o cada varios
  meses), con total del mes y edición.
- **Apartados**: el colchón y la reserva para imprevistos que ya tienes, cuánto apartas cada mes,
  y un botón para empezar de cero.

### Cómo se calcula el disponible

```
disponible = ingresos_del_mes − gastos_fijos_del_mes − pagos_MSI_activos
           − aporte_a_la_reserva − gastos_del_día_a_día − imprevistos_no_cubiertos
           + lo_que_sobró_el_mes_pasado
```

La reserva para imprevistos es un fondo real que se acumula mes a mes; si un imprevisto se pasa de
lo que hay en el fondo, el excedente sí baja el disponible. Lo que sobra al cerrar el mes se guarda
solo y se suma al siguiente (y si te pasaste, se resta).

Toda esta lógica vive como funciones puras en `src/domain/` — ver [CLAUDE.md](CLAUDE.md) para el
detalle de la arquitectura.

## Requisitos

- Node.js y npm
- Expo SDK **57** (revisa los docs versionados: https://docs.expo.dev/versions/v57.0.0/)
- Para correr en Android: Android Studio con un emulador, o un teléfono con
  [Expo Go](https://expo.dev/go) / depuración USB

## Empezar

```bash
npm install
npx expo start
```

En la salida del comando puedes abrir la app en un emulador Android, un simulador iOS, en el
navegador, o escaneando el QR con Expo Go.

```bash
npm run android   # abre directo en un emulador/dispositivo Android
npm run ios       # abre directo en un simulador iOS
npm run web       # corre en el navegador
npm run lint      # expo lint
```

No hay corredor de tests configurado. Para validar la lógica de `src/domain/` contra números
reales, se puede escribir un script suelto y correrlo con `npx tsx ruta/al/script.ts`.

### APK rápido (para instalar en tu teléfono o compartir para probar)

Este proyecto usa el flujo *managed* de Expo, así que la carpeta `android/` no existe hasta que se
genera una vez:

```bash
npx expo prebuild -p android     # solo la primera vez (o si cambias app.json/plugins)
cd android
./gradlew assembleRelease        # Windows: gradlew.bat assembleRelease
```

El APK queda en:

```
android/app/build/outputs/apk/release/app-release.apk
```

Instálalo con `adb install android/app/build/outputs/apk/release/app-release.apk`
o pásalo al teléfono y ábrelo (activa "instalar de orígenes desconocidos" si
Android lo pide).

## Aprender más

- [Documentación de Expo v57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router (rutas por archivo)](https://docs.expo.dev/router/introduction)
- [NativeWind](https://www.nativewind.dev/)
