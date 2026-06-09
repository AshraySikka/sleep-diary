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
    """
    Generate a PDF report of sleep diary entries for a date range.
    Returns a BytesIO buffer containing the PDF bytes.

    Layout:
    - Header with user info and date range
    - Summary statistics (averages)
    - Detailed table with all fields for each date
    """
    buffer = io.BytesIO()

    # Use landscape A4 for the wide table
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=10 * mm,
        leftMargin=10 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # ---- Title ----
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#4F46E5'),
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6B7280'),
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#374151'),
        alignment=TA_LEFT,
    )

    elements.append(Paragraph('Sleep Diary Report', title_style))
    elements.append(Paragraph(
        f'Consensus Sleep Diary — Modified (CSD-M)',
        subtitle_style
    ))
    elements.append(Paragraph(
        f'Patient: {user.full_name}  |  '
        f'Date Range: {start_date} to {end_date}  |  '
        f'Total Entries: {len(entries)}',
        subtitle_style
    ))
    elements.append(Spacer(1, 6 * mm))

    # ---- Summary Stats ----
    valid = [e for e in entries if e.tst_min is not None]
    if valid:
        avg_se = sum(float(e.sleep_efficiency) for e in valid if e.sleep_efficiency) / len(valid)
        avg_tst = sum(e.tst_min for e in valid) / len(valid)
        avg_lat = sum(e.q3_sleep_latency_min for e in valid if e.q3_sleep_latency_min) / max(len([e for e in valid if e.q3_sleep_latency_min]), 1)

        summary_data = [
            ['Average Sleep Efficiency', 'Average Total Sleep Time', 'Average Sleep Latency', 'Total Entries'],
            [
                f'{avg_se:.1f}%',
                f'{avg_tst / 60:.1f} hrs ({avg_tst:.0f} min)',
                f'{avg_lat:.0f} min',
                str(len(entries)),
            ]
        ]

        summary_table = Table(summary_data, colWidths=[70 * mm, 70 * mm, 60 * mm, 40 * mm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, 1), 11),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, 1), [colors.HexColor('#EEF2FF')]),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#C7D2FE')),
            ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#C7D2FE')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 6 * mm))

    # ---- Detailed Table ----
    elements.append(Paragraph('Detailed Sleep Log', ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=colors.HexColor('#4F46E5'),
        spaceAfter=3,
    )))

    # Table headers — all CSD-M fields
    headers = [
        'Date',
        'Bed\nTime',
        'Sleep\nAttempt',
        'Latency\n(min)',
        'Wake\nUps',
        'WASO\n(min)',
        'Final\nAwakening',
        'Post-Awake\nBed (min)',
        'Early\nAwake',
        'Early\nBy (min)',
        'Out of\nBed',
        'TST\n(min)',
        'TIB\n(min)',
        'SE\n(%)',
        'Quality',
        'Restfulness',
        'Naps',
        'Nap\n(min)',
        'Alcohol',
        'Last\nAlcohol',
        'Caffeine',
        'Last\nCaffeine',
        'Meds',
        'Comments',
    ]

    table_data = [headers]

    for entry in entries:
        row = [
            str(entry.date),
            format_time(entry.q1_bed_time),
            format_time(entry.q2_sleep_attempt_time),
            format_value(entry.q3_sleep_latency_min),
            format_value(entry.q4_awakening_count),
            format_value(entry.q5_waso_min),
            format_time(entry.q6a_final_awakening_time),
            format_value(entry.q6b_post_awakening_bed_min),
            format_bool(entry.q6c_early_awakening),
            format_value(entry.q6d_early_awakening_min) if entry.q6c_early_awakening else 'N/A',
            format_time(entry.q7_out_of_bed_time),
            format_value(entry.tst_min),
            format_value(entry.tib_min),
            f'{entry.sleep_efficiency:.1f}%' if entry.sleep_efficiency else 'N/A',
            get_quality_label(entry.q9_sleep_quality),
            get_restfulness_label(entry.q10_restfulness),
            format_value(entry.q11a_nap_count),
            format_value(entry.q11b_nap_duration_min) if entry.q11a_nap_count else 'N/A',
            format_value(entry.q12a_alcohol_count),
            format_time(entry.q12b_alcohol_last_time) if entry.q12a_alcohol_count else 'N/A',
            format_value(entry.q13a_caffeine_count),
            format_time(entry.q13b_caffeine_last_time) if entry.q13a_caffeine_count else 'N/A',
            format_bool(entry.q14a_medication_taken),
            (entry.q15_comments or '')[:30],
        ]
        table_data.append(row)

    # Column widths — tighter for boolean/count columns, wider for time/text
    col_widths = [
        18*mm, 14*mm, 14*mm, 12*mm, 11*mm, 11*mm, 14*mm, 13*mm,
        11*mm, 11*mm, 14*mm, 11*mm, 11*mm, 10*mm, 14*mm, 20*mm,
        10*mm, 11*mm, 12*mm, 14*mm, 12*mm, 14*mm, 10*mm, 20*mm,
    ]

    detail_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    detail_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 7),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        # Data rows
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 1), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [
            colors.white,
            colors.HexColor('#F5F3FF'),
        ]),
        # Grid
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#C7D2FE')),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#E5E7EB')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))

    elements.append(detail_table)
    elements.append(Spacer(1, 6 * mm))

    # Footer note
    elements.append(Paragraph(
        'Generated by Sleep Diary App — CSD-M clinical instrument. '
        'All metrics calculated using validated CSD-M formulas. '
        'This report is for clinical reference only.',
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=7,
            textColor=colors.HexColor('#9CA3AF'),
            alignment=TA_CENTER,
        )
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
            subject=f'Sleep Diary Report — {request.user.full_name} ({start_str} to {end_str})',
            body=(
                f'Please find attached the Sleep Diary report for {request.user.full_name}.\n\n'
                f'Date Range: {start_str} to {end_str}\n'
                f'Total Entries: {len(entries)}\n\n'
                f'This report was generated by the Sleep Diary app using the '
                f'Consensus Sleep Diary — Modified (CSD-M) clinical instrument.\n\n'
                f'All metrics are calculated using validated CSD-M formulas.'
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