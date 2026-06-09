from django.urls import path
from reports.views import GenerateReportView, EmailReportView

urlpatterns = [
    path('generate/', GenerateReportView.as_view(), name='generate-report'),
    path('email/', EmailReportView.as_view(), name='email-report'),
]