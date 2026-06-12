from __future__ import print_function
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


OUTPUT_PDF = r"e:\dev\wedding-app\docs\presentacion-app-bodas-comercial.pdf"
LOGO_PATH = r"e:\dev\wedding-app\wedding-frontend\src\assets\img\lg.png"

IMAGES = [
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.38-35f02f8f-c8ba-4ee3-91a5-bba04d94bc48.png",  # login
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.38__1_-23d22de5-e227-4951-92a0-b0fe029b7b71.png",  # register
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.38__2_-5055b4a0-a0eb-408a-8b8e-664d69bcd104.png",  # dashboard (confirm)
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.37__3_-3342ea4a-f313-4a88-83ba-10aff6f65812.png",  # dashboard details
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.37__2_-22bbbf2f-4dba-49ab-baaa-38b799627a7b.png",  # menu top
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.37__1_-49e1e813-58e9-453d-9166-eb10b6077dac.png",  # menu bottom
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.37-23330c14-3019-4ddb-ac59-82b93179277a.png",  # gallery grid
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.36-4602cc1e-7d13-435c-bad1-713a6f5742b3.png",  # song request
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_WhatsApp_Image_2026-03-20_at_14.09.36__1_-64077571-fe61-4427-bf3e-47e771c25556.png",  # photo modal
    r"C:\Users\cjesp\.cursor\projects\e-dev-wedding-app\assets\c__Users_cjesp_AppData_Roaming_Cursor_User_workspaceStorage_627ff68ab5ca8cd47d0bf1b68136bdd4_images_image-f34e2b89-768d-4969-af9c-29db67c50933.png",  # display projector
]


SECTIONS = [
    ("1) Ingreso", "El invitado entra con su usuario y contrasena para comenzar."),
    ("2) Registro", "Si todavia no tiene cuenta, se registra en pocos pasos."),
    ("3) Inicio - Confirmar presencia", "Desde aqui confirma asistencia al evento."),
    ("4) Inicio - Datos del evento", "Se ven fecha, hora, lugar y como llegar al salon."),
    ("5) Menu de la boda (inicio)", "Muestra el menu de forma elegante y facil de leer."),
    ("6) Menu de la boda (continuacion)", "Se ven todos los pasos del servicio de comida."),
    ("7) Galeria de fotos", "Los invitados ven fotos del evento y cantidad de likes."),
    ("8) Pedidos de musica", "Cada invitado puede pedir canciones al DJ."),
    ("9) Foto en detalle", "Al abrir una foto puede dar like y compartirla."),
    ("10) Pantalla en vivo para salon", "Las fotos que suben los invitados aparecen destacadas y luego se integran a la galeria proyectada en el salon."),
]


def draw_wrapped_text(c, text, x, y, max_width, line_height=14):
    words = text.split()
    line = ""
    current_y = y
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", 11) <= max_width:
            line = test
        else:
            c.drawString(x, current_y, line)
            current_y -= line_height
            line = w
    if line:
        c.drawString(x, current_y, line)
    return current_y - line_height


def draw_image_fit(c, image_path, x, y, w, h):
    img = ImageReader(image_path)
    iw, ih = img.getSize()
    scale = min(float(w) / iw, float(h) / ih)
    nw = iw * scale
    nh = ih * scale
    dx = x + (w - nw) / 2.0
    dy = y + (h - nh) / 2.0
    c.drawImage(img, dx, dy, width=nw, height=nh, preserveAspectRatio=True, mask='auto')


def draw_header(c, page_w, page_h, title_text):
    c.setStrokeColorRGB(0.82, 0.70, 0.27)
    c.setLineWidth(1)
    c.line(30, page_h - 36, page_w - 30, page_h - 36)

    c.setFont("Helvetica-Bold", 13)
    c.drawString(40, page_h - 28, title_text)

    if os.path.exists(LOGO_PATH):
        try:
            logo = ImageReader(LOGO_PATH)
            c.drawImage(logo, page_w - 118, page_h - 38, width=78, height=30, mask='auto', preserveAspectRatio=True)
        except Exception:
            pass


def main():
    if not os.path.isdir(os.path.dirname(OUTPUT_PDF)):
        os.makedirs(os.path.dirname(OUTPUT_PDF))

    c = canvas.Canvas(OUTPUT_PDF, pagesize=A4)
    page_w, page_h = A4

    # Single commercial intro page
    draw_header(c, page_w, page_h, "Presentacion Comercial - App de Bodas")
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, page_h - 82, "Una app simple para organizar y vivir la boda")
    c.setFont("Helvetica", 11)
    intro = [
        "Esta aplicacion acompana al invitado antes y durante la fiesta.",
        "",
        "Beneficios principales:",
        "- Mas orden: todo en un solo lugar (sin mensajes dispersos).",
        "- Menos dudas: fecha, hora, lugar y mapa siempre visibles.",
        "- Mejor experiencia: menu, galeria y pedidos al DJ en vivo.",
        "- Mas participacion: fotos con likes y pantalla en el salon.",
        "- Imagen premium: experiencia moderna y profesional del evento.",
    ]
    y = page_h - 118
    for line in intro:
        c.drawString(60, y, line)
        y -= 20
    c.showPage()

    # Screen pages
    for idx, image_path in enumerate(IMAGES):
        title, purpose = SECTIONS[idx]

        draw_header(c, page_w, page_h, "Presentacion Comercial - App de Bodas")

        c.setFont("Helvetica-Bold", 16)
        c.drawString(40, page_h - 56, title)

        # Two-column text block to avoid overlap
        label_x = 40
        text_x = 190
        text_w = page_w - text_x - 40

        c.setFont("Helvetica-Bold", 11)
        c.drawString(label_x, page_h - 80, "Para que sirve esta pantalla:")
        c.setFont("Helvetica", 11)
        y_after_purpose = draw_wrapped_text(c, purpose, text_x, page_h - 80, text_w)

        c.setFont("Helvetica-Bold", 11)
        usage_title_y = y_after_purpose - 4
        c.drawString(label_x, usage_title_y, "Que hace el invitado:")
        c.setFont("Helvetica", 11)
        usage = "La usa desde su celular tocando botones claros y siguiendo pasos simples."
        draw_wrapped_text(c, usage, text_x, usage_title_y, text_w)

        frame_x, frame_y = 40, 70
        frame_w, frame_h = page_w - 80, page_h - 210
        c.roundRect(frame_x, frame_y, frame_w, frame_h, 8, stroke=1, fill=0)

        if os.path.exists(image_path):
            draw_image_fit(c, image_path, frame_x + 10, frame_y + 10, frame_w - 20, frame_h - 20)
        else:
            c.setFont("Helvetica-Oblique", 10)
            c.drawString(frame_x + 12, frame_y + frame_h - 22, "Imagen no encontrada: " + image_path)

        c.setFont("Helvetica-Oblique", 9)
        c.drawString(40, 45, "Pantalla %d de %d" % (idx + 1, len(IMAGES)))
        c.showPage()

    # Closing page
    draw_header(c, page_w, page_h, "Presentacion Comercial - App de Bodas")
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, page_h - 80, "Beneficio comercial")
    c.setFont("Helvetica", 11)
    end_lines = [
        "La app cubre todo el recorrido del invitado en un solo lugar:",
        "ingreso, confirmacion, informacion, fotos y participacion en la fiesta.",
        "",
        "Resultado:",
        "mas orden, mejor experiencia para invitados y una propuesta diferencial para vender.",
    ]
    y = page_h - 110
    for line in end_lines:
        c.drawString(60, y, line)
        y -= 20

    c.save()
    print("PDF generado:", OUTPUT_PDF)


if __name__ == "__main__":
    main()

