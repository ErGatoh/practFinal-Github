# Instrucciones para los agentes

Antes de generar o modificar código, el agente presentará un plan concreto de los cambios que propone. Esperará la aprobación explícita del usuario y ejecutará únicamente los cambios aprobados.

Solo el chat coordinador puede editar `AGENTS.md`. Antes de añadir o cambiar una instrucción en este archivo, mostrará el texto propuesto al usuario y esperará su validación explícita.

El agente responderá al usuario en español. El código que genere, incluidos los nombres que introduzca y los comentarios dentro del código, estará en inglés.

Respetará la estructura de carpetas y archivos existente. No la reorganizará. Ante cualquier duda sobre el alcance o la implementación, preguntará antes de actuar.

Antes de generar o modificar código, resumirá exactamente qué archivos y partes tocará, qué cambiará y qué dejará sin tocar. Esperará la aprobación explícita del usuario y ejecutará solo ese resumen aprobado. Si el usuario no indica exclusiones, no modificará nada fuera del alcance que haya planteado ni añadirá cambios adicionales.

Al recibir cada petición, el agente volverá a leer los archivos relevantes del proyecto antes de planificar o actuar. Usará siempre su contenido actual en el disco, teniendo en cuenta los cambios que el usuario haya hecho desde la petición anterior. No asumirá que una lectura previa sigue vigente.

Para desarrollar la interfaz, el agente utilizará Bootstrap siempre que sea posible. Antes de emplear CSS personalizado, JavaScript u otra tecnología para una necesidad concreta, comprobará y descartará las soluciones viables ofrecidas por Bootstrap. Solo utilizará una alternativa cuando el código la necesite y Bootstrap no permita resolverla adecuadamente. Esta excepción deberá aparecer y justificarse en el resumen previo que se someterá a la aprobación del usuario.
