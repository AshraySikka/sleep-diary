# reports/views.py
# -----------------------------------------------------------------------
# Handles PDF report generation and emailing to clinician.
# User selects a date range, we pull all entries in that range,
# generate a clean PDF table, and either download or email it.
# -----------------------------------------------------------------------

import io
from datetime import datetime
from django.core.mail import EmailMessage
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from diary.models import SleepEntry
from users.models import UserProfile


def format_time(t):
    """Format a time object to 12-hour string, or N/A if None."""
    if t is None:
        return 'N/A'
    return t.strftime('%I:%M %p')


def format_value(value, suffix=''):
    """Format a value with optional suffix, or N/A if None."""
    if value is None:
        return 'N/A'
    return f'{value}{suffix}'


def format_bool(value):
    """Format a boolean to Yes/No string."""
    if value is None:
        return 'N/A'
    return 'Yes' if value else 'No'


def get_quality_label(value):
    """Convert numeric quality score to label."""
    labels = {
        1: 'Very Poor',
        2: 'Poor',
        3: 'Fair',
        4: 'Good',
        5: 'Very Good',
    }
    return labels.get(value, 'N/A')


def get_restfulness_label(value):
    """Convert numeric restfulness score to label."""
    labels = {
        1: 'Not at all rested',
        2: 'Slightly rested',
        3: 'Somewhat rested',
        4: 'Well-rested',
        5: 'Very well-rested',
    }
    return labels.get(value, 'N/A')


def generate_pdf_report(user, entries, start_date, end_date):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # ---- Color palette ----
    emerald = colors.HexColor('#059669')
    emerald_dark = colors.HexColor('#065f46')
    emerald_pale = colors.HexColor('#f0fdf4')
    emerald_mid = colors.HexColor('#d1fae5')
    gray_dark = colors.HexColor('#111827')
    gray_mid = colors.HexColor('#6b7280')
    gray_light = colors.HexColor('#f9fafb')
    white = colors.white

    def ps(name, size, bold=False, color=None, align=TA_LEFT, leading=None):
        return ParagraphStyle(
            name, parent=styles['Normal'],
            fontSize=size,
            fontName='Helvetica-Bold' if bold else 'Helvetica',
            textColor=color or gray_dark,
            alignment=align,
            leading=leading or size * 1.3,
        )

    # ---- Header ----
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph('Sleep Diary Report', ps('t', 20, bold=True, color=emerald_dark, align=TA_CENTER)))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        'Consensus Sleep Diary — Modified (CSD-M)',
        ps('s1', 9, color=gray_mid, align=TA_CENTER)
    ))
    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph(
        f'Patient: <b>{user.full_name}</b> &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'Date Range: <b>{start_date}</b> to <b>{end_date}</b> &nbsp;&nbsp;|&nbsp;&nbsp; '
        f'Total Entries: <b>{len(entries)}</b>',
        ps('s2', 8, color=gray_mid, align=TA_CENTER)
    ))
    elements.append(Spacer(1, 6 * mm))

    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph(
        'Developed by Ashray Sikka &nbsp;|&nbsp; ashray15.sikka@gmail.com',
        ps('brand', 7, color=emerald, align=TA_CENTER)
    ))

    # Thin divider line
    from reportlab.platypus import HRFlowable
    elements.append(HRFlowable(width='100%', thickness=0.5, color=emerald_mid, spaceAfter=6 * mm))

    # ---- Summary stats ----
    valid = [e for e in entries if e.tst_min is not None]
    if valid:
        se_list = [float(e.sleep_efficiency) for e in valid if e.sleep_efficiency]
        avg_se = sum(se_list) / len(se_list) if se_list else None
        avg_tst = sum(e.tst_min for e in valid) / len(valid)
        lat_list = [e.q3_sleep_latency_min for e in valid if e.q3_sleep_latency_min is not None]
        avg_lat = sum(lat_list) / len(lat_list) if lat_list else None

        def stat_cell(label, value):
            return [
                Paragraph(label, ps('sl', 7, color=gray_mid, align=TA_CENTER)),
                Paragraph(value, ps('sv', 14, bold=True, color=emerald, align=TA_CENTER)),
            ]

        summary_data = [[
            stat_cell('AVG SLEEP EFFICIENCY', f'{avg_se:.1f}%' if avg_se else 'N/A'),
            stat_cell('AVG TOTAL SLEEP TIME', f'{avg_tst / 60:.1f} hrs ({avg_tst:.0f} min)'),
            stat_cell('AVG SLEEP LATENCY', f'{avg_lat:.0f} min' if avg_lat else 'N/A'),
            stat_cell('TOTAL ENTRIES', str(len(entries))),
        ]]

        page_w = landscape(A4)[0] - 30 * mm
        stat_w = page_w / 4

        summary_table = Table(summary_data, colWidths=[stat_w] * 4)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), emerald_pale),
            ('BOX', (0, 0), (-1, -1), 0.5, emerald_mid),
            ('LINEAFTER', (0, 0), (2, -1), 0.5, emerald_mid),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 8 * mm))

    # ---- Helper to make table cells ----
    def hdr(text):
        return Paragraph(text, ps('h', 6.5, bold=True, color=white, align=TA_CENTER))

    def dat(text):
        return Paragraph(str(text), ps('d', 6.5, color=gray_dark, align=TA_CENTER))

    row_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), emerald_dark),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, emerald_pale]),
        ('BOX', (0, 0), (-1, -1), 0.3, emerald_mid),
        ('INNERGRID', (0, 0), (-1, -1), 0.2, emerald_mid),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ])

    # ---- Table 1: Night metrics ----
    elements.append(Paragraph('Night Metrics', ps('sec', 9, bold=True, color=emerald_dark)))
    elements.append(Spacer(1, 2 * mm))

    h1 = ['Date', 'Bed Time', 'Sleep\nAttempt', 'Latency\n(min)', 'Wake\nUps', 'WASO\n(min)',
          'Final\nAwakening', 'Post-Awake\nBed (min)', 'Early\nAwake', 'Earlier\nBy (min)',
          'Out of\nBed', 'TST\n(min)', 'TIB\n(min)', 'SE (%)']

    cw1 = [18, 16, 16, 14, 12, 12, 16, 15, 12, 13, 16, 13, 13, 12]
    cw1 = [x * mm for x in cw1]

    t1_data = [[hdr(h) for h in h1]]
    for e in entries:
        t1_data.append([
            dat(str(e.date)),
            dat(format_time(e.q1_bed_time)),
            dat(format_time(e.q2_sleep_attempt_time)),
            dat(format_value(e.q3_sleep_latency_min)),
            dat(format_value(e.q4_awakening_count)),
            dat(format_value(e.q5_waso_min)),
            dat(format_time(e.q6a_final_awakening_time)),
            dat(format_value(e.q6b_post_awakening_bed_min)),
            dat(format_bool(e.q6c_early_awakening)),
            dat(format_value(e.q6d_early_awakening_min) if e.q6c_early_awakening else 'N/A'),
            dat(format_time(e.q7_out_of_bed_time)),
            dat(format_value(e.tst_min)),
            dat(format_value(e.tib_min)),
            dat(f'{float(e.sleep_efficiency):.1f}%' if e.sleep_efficiency else 'N/A'),
        ])

    t1 = Table(t1_data, colWidths=cw1, repeatRows=1)
    t1.setStyle(row_style)
    elements.append(t1)
    elements.append(Spacer(1, 6 * mm))

    # ---- Table 2: Subjective + daytime ----
    elements.append(Paragraph('Sleep Quality & Daytime Behaviours', ps('sec2', 9, bold=True, color=emerald_dark)))
    elements.append(Spacer(1, 2 * mm))

    h2 = ['Date', 'Quality', 'Restfulness', 'Naps', 'Nap\n(min)', 'Alcohol', 'Last\nAlcohol',
          'Caffeine', 'Last\nCaffeine', 'Meds', 'Medication Details', 'Comments']

    cw2 = [18, 16, 18, 10, 12, 14, 14, 12, 14, 10, 28, 50]
    cw2 = [x * mm for x in cw2]

    t2_data = [[hdr(h) for h in h2]]
    for e in entries:
        t2_data.append([
            dat(str(e.date)),
            dat(get_quality_label(e.q9_sleep_quality)),
            dat(get_restfulness_label(e.q10_restfulness)),
            dat(format_value(e.q11a_nap_count)),
            dat(format_value(e.q11b_nap_duration_min) if e.q11a_nap_count else 'N/A'),
            dat(format_value(e.q12a_alcohol_count)),
            dat(format_time(e.q12b_alcohol_last_time) if e.q12a_alcohol_count else 'N/A'),
            dat(format_value(e.q13a_caffeine_count)),
            dat(format_time(e.q13b_caffeine_last_time) if e.q13a_caffeine_count else 'N/A'),
            dat(format_bool(e.q14a_medication_taken)),
            dat((e.q14b_medication_details or 'N/A')[:30]),
            dat((e.q15_comments or '')[:50]),
        ])

    t2 = Table(t2_data, colWidths=cw2, repeatRows=1)
    t2.setStyle(row_style)
    elements.append(t2)
    elements.append(Spacer(1, 8 * mm))

    # ---- Footer ----
    elements.append(HRFlowable(width='100%', thickness=0.3, color=emerald_mid, spaceBefore=2 * mm, spaceAfter=3 * mm))
    elements.append(Paragraph(
        'Generated by <b>Sleep Diary App</b> &nbsp;|&nbsp; CSD-M Clinical Instrument &nbsp;|&nbsp; '
        'All metrics calculated using validated CSD-M formulas &nbsp;|&nbsp; For clinical reference only.',
        ps('ft', 7, color=gray_mid, align=TA_CENTER)
    ))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        '<b>Built by Ashray Sikka</b> &nbsp;|&nbsp; '
        'ashray15.sikka@gmail.com &nbsp;|&nbsp; '
        'github.com/AshraySikka',
        ps('ft2', 7, color=emerald, align=TA_CENTER)
    ))
    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph(
        '© 2026 Ashray Sikka. All rights reserved. '
        'This application and its reports are provided for personal and clinical reference only. '
        'Unauthorized reproduction or distribution is prohibited.',
        ps('ft3', 6.5, color=gray_mid, align=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


class GenerateReportView(APIView):
    """
    POST /api/reports/generate/
    Generates a PDF report for a date range and returns it as a download.

    Request body:
        start_date: YYYY-MM-DD
        end_date:   YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_str = request.data.get('start_date')
        end_str = request.data.get('end_date')

        if not start_str or not end_str:
            return Response(
                {'error': 'start_date and end_date are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if end_date < start_date:
            return Response(
                {'error': 'end_date must be after start_date.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        entries = list(
            SleepEntry.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date,
            ).order_by('date')
        )

        if not entries:
            return Response(
                {'error': 'No entries found for the selected date range.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generate the PDF
        buffer = generate_pdf_report(
            request.user, entries, start_str, end_str
        )

        # Return as a downloadable file response
        from django.http import HttpResponse
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="sleep-diary-{start_str}-to-{end_str}.pdf"'
        )
        return response


class EmailReportView(APIView):
    """
    POST /api/reports/email/
    Generates a PDF report and emails it to the clinician.

    Request body:
        start_date:       YYYY-MM-DD
        end_date:         YYYY-MM-DD
        clinician_email:  doctor@clinic.com  (optional — falls back to profile)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_str = request.data.get('start_date')
        end_str = request.data.get('end_date')
        clinician_email = request.data.get('clinician_email')

        # Fall back to the clinician email saved in the user's profile
        if not clinician_email:
            try:
                profile = request.user.profile
                clinician_email = profile.clinician_email
            except UserProfile.DoesNotExist:
                pass

        if not clinician_email:
            return Response(
                {'error': 'No clinician email provided. Add one in your profile or include it in the request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not start_str or not end_str:
            return Response(
                {'error': 'start_date and end_date are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        entries = list(
            SleepEntry.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date,
            ).order_by('date')
        )

        if not entries:
            return Response(
                {'error': 'No entries found for the selected date range.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generate the PDF
        buffer = generate_pdf_report(
            request.user, entries, start_str, end_str
        )

        # Build and send the email with PDF attached
        email = EmailMessage(
            subject=f'Sleep Diary Report - {request.user.full_name} ({start_str} to {end_str})',
            body=(
                f'Please find attached the Sleep Diary report for {request.user.full_name}.\n\n'
                f'Date Range: {start_str} to {end_str}\n'
                f'Total Entries: {len(entries)}\n\n'
                f'NOTE: If this email arrived in your spam folder, please mark it as "Not Spam" '
                f'to ensure future reports are delivered to your inbox.\n\n'
                f'This report was generated by the Sleep Diary app using the '
                f'Consensus Sleep Diary: Modified (CSD-M) clinical instrument.\n\n'
                f'All metrics are calculated using validated CSD-M formulas.\n\n'
                f'Built by Ashray Sikka — ashray15.sikka@gmail.com'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[clinician_email],
            reply_to=[request.user.email],
        )

        email.attach(
            filename=f'sleep-diary-{start_str}-to-{end_str}.pdf',
            content=buffer.read(),
            mimetype='application/pdf',
        )

        try:
            email.send()
        except Exception as e:
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                'message': f'Report sent successfully to {clinician_email}.',
                'clinician_email': clinician_email,
                'entries_included': len(entries),
            },
            status=status.HTTP_200_OK,
        )