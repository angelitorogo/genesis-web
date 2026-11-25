# GENESIS 38.bis-T7q — Informe

En T7p, `supportHeight` se ajustaba al valor exacto de `hit.point` sin despeje.
Esto puede causar clipping por la superficie y z-fighting al orbitar la cámara.
T7q añade una separación microscópica a las piezas en contacto, incluyendo los
módulos elevados mediante su soporte base. Mantiene las matrices originales para
restauración reversible al cerrar el modal. No se modifican mallas de terreno,
shader de superficie ni geometría arquitectónica. Validación visual pendiente.
