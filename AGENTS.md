# Instrucciones para los agentes

## Global

Antes de generar o modificar código, el agente presentará un plan concreto de los cambios que propone. Esperará la aprobación explícita del usuario y ejecutará únicamente los cambios aprobados.

Solo el chat coordinador puede editar `AGENTS.md`. Antes de añadir o cambiar una instrucción en este archivo, mostrará el texto propuesto al usuario y esperará su validación explícita.

El agente responderá al usuario en español. El código que genere, incluidos los nombres que introduzca y los comentarios dentro del código, estará en inglés.

Respetará la estructura de carpetas y archivos existente. No la reorganizará. Ante cualquier duda sobre el alcance o la implementación, preguntará antes de actuar.

Antes de generar o modificar código, resumirá exactamente qué archivos y partes tocará, qué cambiará y qué dejará sin tocar. Esperará la aprobación explícita del usuario y ejecutará solo ese resumen aprobado. Si el usuario no indica exclusiones, no modificará nada fuera del alcance que haya planteado ni añadirá cambios adicionales.

Al recibir cada petición, el agente volverá a leer los archivos relevantes del proyecto antes de planificar o actuar. Usará siempre su contenido actual en el disco, teniendo en cuenta los cambios que el usuario haya hecho desde la petición anterior. No asumirá que una lectura previa sigue vigente.

Antes de planificar o modificar cualquier parte del formulario de contratación, el agente leerá `scrum_project.md`, «Practica 2 Formulario de contratacion.pdf» y los archivos relevantes en su estado actual. Utilizará `scrum_project.md` como registro de decisiones, alcance, correcciones, pruebas y trabajo pendiente, sin asumir que sustituye el estado real de Jira ni el contenido actual del código.

El agente hará las lecturas obligatorias y limitará las demás consultas a los fragmentos necesarios. Agrupará operaciones independientes y evitará búsquedas, pruebas y explicaciones redundantes. La verificación será proporcional al cambio y respetará las instrucciones expresas del usuario.

En `scrum_project.md` mantendrá una bitácora breve: una sola entrada por tarea, que actualizará si hay correcciones posteriores. Recogerá únicamente el cambio, la prueba y el resultado relevantes, sin duplicar descripciones de Jira ni acumular historiales repetidos.

Los planes previos y las respuestas serán breves y concretos, sin repetir información ya establecida, pero conservarán los archivos, límites y aprobaciones que exigen estas instrucciones.

Para desarrollar la interfaz, el agente utilizará Bootstrap siempre que sea posible. Antes de emplear CSS personalizado, JavaScript u otra tecnología para una necesidad concreta, comprobará y descartará las soluciones viables ofrecidas por Bootstrap. Solo utilizará una alternativa cuando el código la necesite y Bootstrap no permita resolverla adecuadamente. Esta excepción deberá aparecer y justificarse en el resumen previo que se someterá a la aprobación del usuario.

El agente seguirá fielmente las instrucciones del usuario y respetará el significado literal y el alcance expresado en cada petición. No reinterpretará una orden de forma que produzca un resultado contrario, diferente o más amplio que el solicitado. No sustituirá las decisiones del usuario por sus propias preferencias ni añadirá supuestos, mejoras o cambios no pedidos.

Si una instrucción admite varias interpretaciones, entra en conflicto con otra instrucción vigente o no puede ejecutarse exactamente como se ha solicitado, el agente detendrá esa parte del trabajo y pedirá una aclaración antes de actuar. Cuando la instrucción sea clara, la ejecutará tal como fue indicada.

El agente no modificará el navbar por iniciativa propia ni como parte de cambios relacionados o mejoras adicionales. Solo podrá modificarlo cuando el usuario lo solicite explícitamente, y limitará esos cambios al alcance exacto aprobado.

Después de cada modificación de código que pertenezca al desarrollo gestionado con Scrum, el agente identificará qué tarea o tareas de Jira afectan los archivos y comportamientos modificados. Al informar del resultado, indicará para cada tarea la corrección relevante realizada, la prueba efectuada y su resultado, y la evidencia disponible. Si el cambio no pertenece a una tarea existente, lo señalará sin atribuirlo a una tarea por suposición.

Cuando el usuario pida «dame la descripción del Scrum», el agente responderá con una plantilla breve: título, descripción, objetivo, criterios de aceptación, prompt EARS, decisiones, pruebas, exclusiones y uso de IA. Cada apartado tendrá solo la información esencial, con redacción natural, clara y fácil de leer rápidamente. Evitará textos extensos, rígidos, repetitivos o excesivamente técnicos.

## Parte 1 · Portada de GitHub

La primera parte es la réplica existente de la portada pública de GitHub. Se conservarán su estructura, identidad visual, recursos e interacciones actuales. Las tareas de la segunda parte no alterarán los módulos de la portada ni el JavaScript de sus modelos 3D salvo petición y aprobación expresas. La integración del nuevo formulario con la home se limitará al alcance que apruebe el usuario.

## Parte 2 · Formulario de contratación

El alcance funcional y los seis pasos de esta parte se regirán por «Practica 2 Formulario de contratacion.pdf». El formulario será una simulación con datos ficticios, sin cobros reales. Se mantendrán la tipografía, colorimetría y apariencia de la portada. Para nombres, características y precios atribuidos a GitHub se consultará su información oficial antes de incorporarlos.

El desarrollo se dividirá en fases aprobadas: primero HTML y diseño responsive sin implementar todavía las interacciones; después navegación, controles y conservación del estado; por último validaciones y recorridos KO/OK. No se anticipará código de fases posteriores sin aprobación del usuario.

Se utilizará Bootstrap para la rejilla y los componentes adecuados: en móvil, contenido de doce columnas; en tablet y escritorio, distribución responsive conforme al espacio y los breakpoints del proyecto. El CSS propio solo completará el diseño cuando Bootstrap no resuelva la necesidad concreta.

El formulario tendrá `action`, `method`, `target`, `name` y `novalidate` como convención acordada para esta parte. Los campos tendrán etiquetas, `name` y un `type` adecuado; los botones tendrán `type` explícito. Las cards de selección exclusiva contendrán controles `radio` reales; la selección múltiple y los consentimientos utilizarán `checkbox`. Se utilizará `disabled` cuando corresponda, teniendo en cuenta que los controles deshabilitados no se incluyen en los datos enviados.

El JavaScript nuevo del formulario se mantendrá diferenciado del JavaScript de la portada y de los modelos 3D, sin reorganizar los archivos existentes. Conservará los valores al navegar o corregir errores. Volver atrás no validará el paso abandonado; avanzar exigirá las validaciones pertinentes.

Los atributos de validación HTML podrán servir de apoyo, pero `novalidate` impedirá que sus mensajes nativos sustituyan la validación propia. JavaScript comprobará mediante funciones reutilizables las reglas exigidas por el PDF, por campo y entre campos: obligatoriedad, correo y confirmación, teléfono, DNI, edad, dirección y provincia, productos y complementos, IBAN, tarjeta y consentimientos. Se utilizarán expresiones regulares cuando proceda, sin sustituir comprobaciones como la letra del DNI, módulo 97 o Luhn. No se añadirá contraseña ni otra condición no exigida sin aprobación expresa.

Al recibir el evento `submit`, se llamará a `preventDefault()` y se validarán los datos y el total antes de confirmar. La corrección de un campo actualizará su error mediante JavaScript sin recargar la página ni consultar constantemente un servidor.

Si el resultado es KO, se conservarán los datos válidos y se mostrarán mensajes útiles bajo los campos incorrectos y un resumen enlazado. Se abrirá el paso del primer error y se desplazará y enfocará su control. Los errores utilizarán texto y atributos como `aria-invalid` y `aria-describedby`, no solamente color. Antes de escoger entre estados visuales `valid`/`invalid`, tooltips u otra presentación, se consultará al usuario.

Por defecto esta práctica no dispone de backend. La confirmación OK será simulada conforme al PDF, con regreso al inicio de la home y un aviso de Bootstrap fijo a la ventana, cerrable y visible durante aproximadamente diez segundos, mostrado una sola vez. No aparecerá al entrar directamente en la home ni se repetirá al recargar. Si posteriormente el usuario aprueba un servicio y proporciona su endpoint y contrato de respuestas, se integrará `fetch` después de la validación local; el servidor deberá validar de nuevo y su JSON KO/OK se presentará mediante el mismo recorrido de errores o éxito. No se afirmará que existe validación de servidor mientras no exista tal servicio.

Se registrarán en Jira o Trello las tareas, sus criterios de aceptación, el uso de IA y las evidencias. Se comprobarán las doce pruebas del PDF, incluidos móvil, escritorio y uso solo con teclado.
