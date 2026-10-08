---
id: ejemplo
titulo: El robo del quiosco
concepto: Fiabilidad del testimonio
pregunta: ¿Qué testigo es más fiable?
opciones:
  - id: paseante
    texto: El paseante, que lo vio a pleno día desde la acera de enfrente
    correcta: true
  - id: conductora
    texto: La conductora, que asegura estar «completamente segura»
  - id: camarero
    texto: El camarero, que se fijó en la navaja del ladrón
escena:
  imagen: ejemplo/escena.svg
  puntos:
    - detalle: quiosco
      etiqueta: El quiosco
      x: 35.5
      y: 9
    - detalle: declaracion-camarero
      etiqueta: El camarero
      x: 79
      y: 14
    - detalle: declaracion-conductora
      etiqueta: La conductora
      x: 53
      y: 55
    - detalle: declaracion-paseante
      etiqueta: El paseante
      x: 31.5
      y: 80
detalles:
  - id: quiosco
    titulo: El mostrador del quiosco
    tipo: ilustracion
    imagen: ejemplo/quiosco.svg
  - id: declaracion-camarero
    titulo: Declaración del camarero
    tipo: documento
  - id: declaracion-conductora
    titulo: Declaración de la conductora
    tipo: documento
  - id: declaracion-paseante
    titulo: Declaración del paseante
    tipo: documento
---

# Lección

> Caso de ejemplo para probar la web. El caso real llegará más adelante.

Nuestra memoria no funciona como una cámara: no graba lo que vemos, sino que lo **reconstruye** cada vez que lo recordamos. Por eso dos testigos sinceros pueden contar cosas distintas.

Para valorar un testimonio no basta con preguntarse si el testigo miente. Hay que preguntarse si **pudo ver bien**: la luz, la distancia, el tiempo que tuvo y dónde estaba puesta su atención.

# Detalle: quiosco

El ladrón se llevó la recaudación del día. Huyó hacia la acera de enfrente.

# Detalle: declaracion-camarero

> «Llevaba una navaja enorme, así, brillante. No podía dejar de mirarla. ¿La cara? Pues… normal, un chico joven, creo.»

# Detalle: declaracion-conductora

> «Estoy completamente segura: era alto, moreno y con barba. Iba parada en el semáforo y lo vi un segundo por el retrovisor. Se lo he contado ya a todo el mundo.»

# Detalle: declaracion-paseante

> «Estaba en la acera de enfrente, esperando para cruzar. Lo vi salir del quiosco y pasar a unos metros de mí: pelo corto rubio, sudadera gris, sin barba. No sé si estoy seguro del todo.»

# Solución comentada

El paseante es el testigo más fiable: había buena luz, la distancia era corta y nada desviaba su atención. Son las **condiciones de observación**, no la seguridad con la que habla, las que hacen fiable un testimonio.

# Error comentado: conductora

Elegiste a la conductora porque está muy segura. Pero la **seguridad** de un testigo dice poco de su **exactitud**: es fácil estar convencido de un recuerdo equivocado, sobre todo si se ha contado muchas veces.

# Error comentado: camarero

El camarero vio la navaja, y precisamente por eso es poco fiable para describir la cara del ladrón. Cuando hay un arma a la vista, la atención se va hacia ella y se recuerda peor todo lo demás.
